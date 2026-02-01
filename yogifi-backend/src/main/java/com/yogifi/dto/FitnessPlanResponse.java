package com.yogifi.dto;

import com.yogifi.model.FitnessPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FitnessPlanResponse {
    private UUID id;
    private String goal;
    private String fitnessLevel;
    private Integer daysPerWeek;
    private String equipment;
    private List<WorkoutDayDto> workoutDays;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WorkoutDayDto {
        private Integer dayNumber;
        private String focus;
        private String warmup;
        private String cooldown;
        private List<ExerciseDto> exercises;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ExerciseDto {
        private String name;
        private Integer sets;
        private String reps;
        private Integer restSeconds;
        private String notes;
    }

    public static FitnessPlanResponse fromEntity(FitnessPlan plan) {
        return FitnessPlanResponse.builder()
            .id(plan.getId())
            .goal(plan.getGoal())
            .fitnessLevel(plan.getFitnessLevel())
            .daysPerWeek(plan.getDaysPerWeek())
            .equipment(plan.getEquipment())
            .createdAt(plan.getCreatedAt())
            .workoutDays(plan.getWorkoutDays().stream().map(day ->
                WorkoutDayDto.builder()
                    .dayNumber(day.getDayNumber())
                    .focus(day.getFocus())
                    .warmup(day.getWarmup())
                    .cooldown(day.getCooldown())
                    .exercises(day.getExercises().stream().map(ex ->
                        ExerciseDto.builder()
                            .name(ex.getName())
                            .sets(ex.getSets())
                            .reps(ex.getReps())
                            .restSeconds(ex.getRestSeconds())
                            .notes(ex.getNotes())
                            .build()
                    ).toList())
                    .build()
            ).toList())
            .build();
    }
}
