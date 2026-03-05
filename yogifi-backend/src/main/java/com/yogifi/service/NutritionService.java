package com.yogifi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogifi.dto.NutritionPlanRequest;
import com.yogifi.dto.NutritionPlanResponse;
import com.yogifi.model.*;
import com.yogifi.repository.MealPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NutritionService {

    private final MealPlanRepository planRepo;
    private final AnthropicService anthropicService;
    private final AiObservabilityService observability;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    // ── System Prompt ────────────────────────────────────────────────────────
    // Design rationale:
    //   • RD persona         — registered dietitian framing for credibility
    //   • Macro validation   — instructs model to keep totals within target range
    //   • Variety principle  — prevents duplicate meals across 7 days
    //   • Strict JSON contract + few-shot — eliminates hallucinated keys
    //
    private static final String SYSTEM_PROMPT = """
        <persona>
        You are a registered dietitian (RD) and sports nutritionist inside the Yogifi app.
        You create practical, balanced 7-day meal plans that fuel yoga practice and active recovery.
        Your plans are colourful, varied, and avoid repeating the same main meal within the 7 days.
        </persona>

        <task>
        Design a 7-day meal plan based on the user's dietary preference, goal, calorie target,
        and any allergies or exclusions.

        Macro guidelines per day:
        - Protein: 25–35 % of calories (critical for muscle recovery after yoga)
        - Carbohydrates: 40–50 % of calories (fuel for movement and brain function)
        - Fat: 20–30 % of calories (hormones, joint lubrication, fat-soluble vitamins)

        Include Breakfast, Lunch, Dinner, and Snack for every day.
        Each meal's macros must sum correctly to its calorie total (protein × 4 + carbs × 4 + fat × 9).
        No two Dinners should be identical across the 7 days.
        </task>

        <output_contract>
        Respond ONLY with valid JSON matching this exact schema — no preamble, no markdown fences:
        {
          "days": [
            {
              "dayNumber": 1,
              "meals": [
                {
                  "mealType": "Breakfast",
                  "name": "Steel-Cut Oat Bowl",
                  "description": "Oats topped with mixed berries, a drizzle of almond butter, and chia seeds",
                  "calories": 380,
                  "protein": 14,
                  "carbs": 52,
                  "fat": 12
                }
              ]
            }
          ]
        }
        </output_contract>

        <example>
        Input: { "preference": "Vegetarian", "goal": "Weight loss", "calorieTarget": 1600, "allergies": "none" }

        Day 1 excerpt:
        {
          "days": [{
            "dayNumber": 1,
            "meals": [
              { "mealType": "Breakfast", "name": "Greek Yoghurt Parfait",     "description": "Low-fat Greek yoghurt layered with granola, blueberries, and a drizzle of honey", "calories": 320, "protein": 18, "carbs": 42, "fat": 7 },
              { "mealType": "Lunch",     "name": "Lentil & Spinach Soup",     "description": "Red lentils simmered with cumin, turmeric, and baby spinach; served with 1 slice rye bread", "calories": 380, "protein": 20, "carbs": 54, "fat": 6 },
              { "mealType": "Dinner",    "name": "Tofu Stir-fry with Brown Rice", "description": "Firm tofu, broccoli, red pepper, and snap peas in a ginger-soy sauce over brown rice", "calories": 480, "protein": 28, "carbs": 58, "fat": 12 },
              { "mealType": "Snack",     "name": "Apple with Almond Butter",  "description": "1 medium apple sliced, served with 1 tbsp natural almond butter", "calories": 180, "protein": 4, "carbs": 24, "fat": 8 }
            ]
          }]
        }
        </example>
        """;

    @Transactional
    public NutritionPlanResponse generatePlan(NutritionPlanRequest request) {
        User user = userService.getCurrentUser();

        String prompt = String.format("""
                {
                  "preference": "%s",
                  "goal": "%s",
                  "calorieTarget": %d,
                  "allergies": "%s"
                }
                Generate a 7-day meal plan following the output contract exactly.""",
                request.getDietaryPreference(),
                request.getGoal(),
                request.getCalorieTarget() != null ? request.getCalorieTarget() : 2000,
                request.getAllergies() != null ? request.getAllergies() : "none");

        AnthropicService.LlmCallRecord record = null;
        String aiResponse = null;
        try {
            record = anthropicService.chatForJson(
                    SYSTEM_PROMPT, List.of(Map.of("role", "user", "content", prompt)));
            aiResponse = record.text();

            observability.record(
                    "nutrition-plan",
                    user.getId().toString(),
                    record,
                    Map.of("preference", request.getDietaryPreference(),
                           "goal", request.getGoal(),
                           "calories", request.getCalorieTarget() != null ? request.getCalorieTarget() : 2000),
                    null);
        } catch (Exception e) {
            log.warn("AI unavailable for nutrition plan, using offline fallback: {}", e.getMessage());
        }

        MealPlan plan = MealPlan.builder()
            .user(user)
            .dietaryPreference(request.getDietaryPreference())
            .goal(request.getGoal())
            .calorieTarget(request.getCalorieTarget())
            .allergies(request.getAllergies())
            .rawResponse(aiResponse != null ? aiResponse : "offline-fallback")
            .build();

        List<MealDay> mealDays = new ArrayList<>();

        if (aiResponse != null) {
            try {
                // chatForJson() already stripped markdown fences
                String json = aiResponse.trim();

                JsonNode root = objectMapper.readTree(json);
                JsonNode days = root.get("days");

                if (days != null && days.isArray()) {
                    for (JsonNode dayNode : days) {
                        MealDay day = MealDay.builder()
                            .plan(plan)
                            .dayNumber(dayNode.get("dayNumber").asInt())
                            .build();

                        List<Meal> meals = new ArrayList<>();
                        JsonNode mealNodes = dayNode.get("meals");
                        if (mealNodes != null && mealNodes.isArray()) {
                            for (JsonNode mealNode : mealNodes) {
                                meals.add(Meal.builder()
                                    .mealDay(day)
                                    .mealType(mealNode.get("mealType").asText())
                                    .name(mealNode.get("name").asText())
                                    .description(mealNode.has("description") ? mealNode.get("description").asText() : null)
                                    .calories(mealNode.has("calories") ? mealNode.get("calories").asInt() : null)
                                    .protein(mealNode.has("protein") ? mealNode.get("protein").asInt() : null)
                                    .carbs(mealNode.has("carbs") ? mealNode.get("carbs").asInt() : null)
                                    .fat(mealNode.has("fat") ? mealNode.get("fat").asInt() : null)
                                    .build());
                            }
                        }
                        day.setMeals(meals);
                        mealDays.add(day);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse nutrition plan JSON, using fallback: {}", e.getMessage());
            }
        }

        // Offline fallback: build a minimal 3-day plan so the endpoint always returns 200
        if (mealDays.isEmpty()) {
            int calTarget = request.getCalorieTarget() != null ? request.getCalorieTarget() : 2000;
            String[][] mealNames = {
                {"Oatmeal with Berries", "Grilled Chicken Salad", "Salmon with Quinoa", "Mixed Nuts"},
                {"Greek Yogurt Parfait", "Lentil Soup with Bread", "Stir-fried Tofu & Vegetables", "Apple with Almond Butter"},
                {"Smoothie Bowl", "Whole Grain Wrap", "Baked Cod with Sweet Potato", "Hummus & Veggie Sticks"}
            };
            String[] mealTypes = {"Breakfast", "Lunch", "Dinner", "Snack"};
            for (int d = 0; d < 3; d++) {
                MealDay day = MealDay.builder().plan(plan).dayNumber(d + 1).build();
                List<Meal> meals = new ArrayList<>();
                for (int m = 0; m < mealTypes.length; m++) {
                    meals.add(Meal.builder()
                        .mealDay(day)
                        .mealType(mealTypes[m])
                        .name(mealNames[d][m])
                        .calories(calTarget / 4)
                        .build());
                }
                day.setMeals(meals);
                mealDays.add(day);
            }
        }

        plan.setMealDays(mealDays);
        plan = planRepo.save(plan);
        return NutritionPlanResponse.fromEntity(plan);
    }

    public List<NutritionPlanResponse> getPlans() {
        User user = userService.getCurrentUser();
        return planRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(NutritionPlanResponse::fromEntity)
            .toList();
    }
}
