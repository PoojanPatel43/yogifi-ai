package com.yogifi.dto;

import com.yogifi.model.MealPlan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NutritionPlanResponse {
    private UUID id;
    private String dietaryPreference;
    private String goal;
    private Integer calorieTarget;
    private String allergies;
    private List<MealDayDto> mealDays;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MealDayDto {
        private Integer dayNumber;
        private List<MealDto> meals;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MealDto {
        private String mealType;
        private String name;
        private String description;
        private Integer calories;
        private Integer protein;
        private Integer carbs;
        private Integer fat;
    }

    public static NutritionPlanResponse fromEntity(MealPlan plan) {
        return NutritionPlanResponse.builder()
            .id(plan.getId())
            .dietaryPreference(plan.getDietaryPreference())
            .goal(plan.getGoal())
            .calorieTarget(plan.getCalorieTarget())
            .allergies(plan.getAllergies())
            .createdAt(plan.getCreatedAt())
            .mealDays(plan.getMealDays().stream().map(day ->
                MealDayDto.builder()
                    .dayNumber(day.getDayNumber())
                    .meals(day.getMeals().stream().map(meal ->
                        MealDto.builder()
                            .mealType(meal.getMealType())
                            .name(meal.getName())
                            .description(meal.getDescription())
                            .calories(meal.getCalories())
                            .protein(meal.getProtein())
                            .carbs(meal.getCarbs())
                            .fat(meal.getFat())
                            .build()
                    ).toList())
                    .build()
            ).toList())
            .build();
    }
}
