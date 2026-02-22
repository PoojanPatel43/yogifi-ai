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
    private final UserService userService;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
        You are a certified fitness trainer AI. Generate a structured workout plan.
        IMPORTANT: Respond ONLY with valid JSON (no markdown, no explanation outside JSON).
        Use this exact structure:
        {
          "days": [
            {
              "dayNumber": 1,
              "focus": "Upper Body",
              "warmup": "5 min light cardio + dynamic stretches",
              "cooldown": "5 min static stretches",
              "exercises": [
                { "name": "Push-ups", "sets": 3, "reps": "10-12", "restSeconds": 60, "notes": "Keep core tight" }
              ]
            }
          ]
        }
        """;

    @Transactional
    public FitnessPlanResponse generatePlan(FitnessPlanRequest request) {
        User user = userService.getCurrentUser();

        String prompt = String.format(
            "Create a %d-day/week workout plan for a %s level person. Goal: %s. Available equipment: %s.",
            request.getDaysPerWeek(),
            request.getFitnessLevel(),
            request.getGoal(),
            request.getEquipment() != null ? request.getEquipment() : "bodyweight only"
        );

        String aiResponse;
        try {
            aiResponse = anthropicService.chat(SYSTEM_PROMPT, List.of(Map.of("role", "user", "content", prompt)));
        } catch (Exception e) {
            log.warn("AI unavailable for fitness plan, using offline fallback: {}", e.getMessage());
            aiResponse = null;
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
                // Strip markdown code fences if present
                String json = aiResponse.trim();
                if (json.startsWith("```")) {
                    json = json.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "");
                }

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
