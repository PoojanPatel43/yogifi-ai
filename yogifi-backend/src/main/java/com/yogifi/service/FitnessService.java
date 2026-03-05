package com.yogifi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogifi.dto.FitnessPlanRequest;
import com.yogifi.dto.FitnessPlanResponse;
import com.yogifi.model.*;
import com.yogifi.repository.FitnessPlanRepository;
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
public class FitnessService {

    private final FitnessPlanRepository planRepo;
    private final AnthropicService anthropicService;
    private final AiObservabilityService observability;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    // ── System Prompt ────────────────────────────────────────────────────────
    // Design rationale:
    //   • Persona section     — certified trainer framing improves specificity
    //   • Progressive overload — key principle baked into the task instructions
    //   • Strict JSON contract — prevents hallucinated keys at temperature 0.1
    //   • Few-shot example    — shows exact exercise object shape expected
    //
    private static final String SYSTEM_PROMPT = """
        <persona>
        You are a certified personal trainer (NASM-CPT) and yoga fitness coach inside the Yogifi app.
        You design safe, progressive workout plans that complement yoga practice — emphasising
        functional mobility, core stability, and injury prevention alongside strength gains.
        </persona>

        <task>
        Generate a structured weekly workout plan matching the user's fitness level, goal,
        and available equipment.

        Principles to apply:
        - Progressive overload: vary sets/reps to build capacity over the week.
        - Balance: alternate muscle groups across days; never train the same group two days in a row.
        - Yoga synergy: include at least one mobility or breathwork exercise per day.
        - Safety: always include a specific warm-up and cool-down suited to the day's focus.

        Adapt to fitness level:
        - Beginner: 2–3 sets, 8–12 reps, 60–90 s rest; compound movements; form notes mandatory.
        - Intermediate: 3–4 sets, 10–15 reps, 45–60 s rest; add supersets where appropriate.
        - Advanced: 4–5 sets, variable reps, 30–45 s rest; include plyometrics or tempo work.
        </task>

        <output_contract>
        Respond ONLY with valid JSON matching this exact schema — no preamble, no markdown fences:
        {
          "days": [
            {
              "dayNumber": 1,
              "focus": "Upper Body + Core",
              "warmup": "5 min light cardio + arm circles + cat-cow",
              "cooldown": "5 min static chest/shoulder stretch + child's pose",
              "exercises": [
                {
                  "name": "Push-up",
                  "sets": 3,
                  "reps": "10-12",
                  "restSeconds": 60,
                  "notes": "Keep core engaged; lower chest to 2 cm from floor"
                }
              ]
            }
          ]
        }
        </output_contract>

        <example>
        Input: { "level": "Beginner", "goal": "Build strength", "daysPerWeek": 3, "equipment": "bodyweight only" }

        Correct output (day 1 excerpt):
        {
          "days": [
            {
              "dayNumber": 1,
              "focus": "Full Body — Foundation",
              "warmup": "5 min march in place + dynamic hip circles + 10 cat-cow stretches",
              "cooldown": "Child's pose (60s), seated forward fold (60s), supine twist each side (30s)",
              "exercises": [
                { "name": "Bodyweight Squat",  "sets": 3, "reps": "12", "restSeconds": 60, "notes": "Push knees out over pinky toes; keep chest tall" },
                { "name": "Incline Push-up",   "sets": 3, "reps": "8",  "restSeconds": 60, "notes": "Use a chair if needed; body forms a straight line from head to heel" },
                { "name": "Glute Bridge",      "sets": 3, "reps": "15", "restSeconds": 45, "notes": "Squeeze glutes at the top; avoid hyper-extending the lower back" },
                { "name": "Dead Bug",          "sets": 2, "reps": "8 each side", "restSeconds": 45, "notes": "Press lower back into floor; extend opposite arm/leg simultaneously" },
                { "name": "Warrior I to II Flow", "sets": 1, "reps": "5 slow breaths each side", "restSeconds": 30, "notes": "Yoga mobility finisher — feel the hip flexor and shoulder opening" }
              ]
            }
          ]
        }
        </example>
        """;

    @Transactional
    public FitnessPlanResponse generatePlan(FitnessPlanRequest request) {
        User user = userService.getCurrentUser();

        String prompt = String.format("""
                {
                  "level": "%s",
                  "goal": "%s",
                  "daysPerWeek": %d,
                  "equipment": "%s"
                }
                Generate a workout plan following the output contract exactly.""",
                request.getFitnessLevel(),
                request.getGoal(),
                request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 3,
                request.getEquipment() != null ? request.getEquipment() : "bodyweight only");

        AnthropicService.LlmCallRecord record = null;
        String aiResponse = null;
        try {
            record = anthropicService.chatForJson(
                    SYSTEM_PROMPT, List.of(Map.of("role", "user", "content", prompt)));
            aiResponse = record.text();

            observability.record(
                    "fitness-plan",
                    user.getId().toString(),
                    record,
                    Map.of("level", request.getFitnessLevel(),
                           "goal", request.getGoal(),
                           "days", request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 3),
                    null);
        } catch (Exception e) {
            log.warn("AI unavailable for fitness plan, using offline fallback: {}", e.getMessage());
        }

        FitnessPlan plan = FitnessPlan.builder()
            .user(user)
            .goal(request.getGoal())
            .fitnessLevel(request.getFitnessLevel())
            .daysPerWeek(request.getDaysPerWeek())
            .equipment(request.getEquipment())
            .rawResponse(aiResponse != null ? aiResponse : "offline-fallback")
            .build();

        List<WorkoutDay> workoutDays = new ArrayList<>();

        if (aiResponse != null) {
            try {
                // chatForJson() already stripped markdown fences
                String json = aiResponse.trim();

                JsonNode root = objectMapper.readTree(json);
                JsonNode days = root.get("days");

                if (days != null && days.isArray()) {
                    for (JsonNode dayNode : days) {
                        WorkoutDay day = WorkoutDay.builder()
                            .plan(plan)
                            .dayNumber(dayNode.get("dayNumber").asInt())
                            .focus(dayNode.has("focus") ? dayNode.get("focus").asText() : "")
                            .warmup(dayNode.has("warmup") ? dayNode.get("warmup").asText() : "")
                            .cooldown(dayNode.has("cooldown") ? dayNode.get("cooldown").asText() : "")
                            .build();

                        List<Exercise> exercises = new ArrayList<>();
                        JsonNode exNodes = dayNode.get("exercises");
                        if (exNodes != null && exNodes.isArray()) {
                            for (JsonNode exNode : exNodes) {
                                exercises.add(Exercise.builder()
                                    .workoutDay(day)
                                    .name(exNode.get("name").asText())
                                    .sets(exNode.has("sets") ? exNode.get("sets").asInt() : null)
                                    .reps(exNode.has("reps") ? exNode.get("reps").asText() : null)
                                    .restSeconds(exNode.has("restSeconds") ? exNode.get("restSeconds").asInt() : null)
                                    .notes(exNode.has("notes") ? exNode.get("notes").asText() : null)
                                    .build());
                            }
                        }
                        day.setExercises(exercises);
                        workoutDays.add(day);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse fitness plan JSON, using fallback: {}", e.getMessage());
            }
        }

        // Offline fallback: build a minimal plan so the endpoint always returns 200
        if (workoutDays.isEmpty()) {
            int days = request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 3;
            for (int d = 1; d <= days; d++) {
                WorkoutDay day = WorkoutDay.builder()
                    .plan(plan)
                    .dayNumber(d)
                    .focus(d % 2 == 0 ? "Lower Body" : "Upper Body")
                    .warmup("5 min light cardio + dynamic stretches")
                    .cooldown("5 min static stretching")
                    .build();
                day.setExercises(List.of(
                    Exercise.builder().workoutDay(day).name("Bodyweight Squat").sets(3).reps("12").restSeconds(60).build(),
                    Exercise.builder().workoutDay(day).name("Push-up").sets(3).reps("10").restSeconds(60).build(),
                    Exercise.builder().workoutDay(day).name("Plank Hold").sets(3).reps("30s").restSeconds(45).build()
                ));
                workoutDays.add(day);
            }
        }

        plan.setWorkoutDays(workoutDays);
        plan = planRepo.save(plan);
        return FitnessPlanResponse.fromEntity(plan);
    }

    public List<FitnessPlanResponse> getPlans() {
        User user = userService.getCurrentUser();
        return planRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(FitnessPlanResponse::fromEntity)
            .toList();
    }
}
