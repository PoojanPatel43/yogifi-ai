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
    private final UserService userService;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
        You are a certified nutritionist AI. Generate a structured 7-day meal plan.
        IMPORTANT: Respond ONLY with valid JSON (no markdown, no explanation outside JSON).
        Use this exact structure:
        {
          "days": [
            {
              "dayNumber": 1,
              "meals": [
                { "mealType": "Breakfast", "name": "Oatmeal Bowl", "description": "Steel-cut oats with berries and honey", "calories": 350, "protein": 12, "carbs": 55, "fat": 8 }
              ]
            }
          ]
        }
        Include Breakfast, Lunch, Dinner, and Snack for each day.
        """;

    @Transactional
    public NutritionPlanResponse generatePlan(NutritionPlanRequest request) {
        User user = userService.getCurrentUser();

        String prompt = String.format(
            "Create a 7-day meal plan. Dietary preference: %s. Goal: %s. Target calories: %d/day. Allergies: %s.",
            request.getDietaryPreference(),
            request.getGoal(),
            request.getCalorieTarget() != null ? request.getCalorieTarget() : 2000,
            request.getAllergies() != null ? request.getAllergies() : "none"
        );

        String aiResponse = anthropicService.chat(SYSTEM_PROMPT, List.of(Map.of("role", "user", "content", prompt)));

        MealPlan plan = MealPlan.builder()
            .user(user)
            .dietaryPreference(request.getDietaryPreference())
            .goal(request.getGoal())
            .calorieTarget(request.getCalorieTarget())
            .allergies(request.getAllergies())
            .rawResponse(aiResponse)
            .build();

        try {
            String json = aiResponse.trim();
            if (json.startsWith("```")) {
                json = json.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
            }

            JsonNode root = objectMapper.readTree(json);
            JsonNode days = root.get("days");

            List<MealDay> mealDays = new ArrayList<>();
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
            plan.setMealDays(mealDays);
        } catch (Exception e) {
            log.warn("Failed to parse nutrition plan JSON, saving raw response: {}", e.getMessage());
        }

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
