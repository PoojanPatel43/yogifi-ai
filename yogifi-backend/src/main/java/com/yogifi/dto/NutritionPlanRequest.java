package com.yogifi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class NutritionPlanRequest {
    private String dietaryPreference;
    private String goal;
    private Integer calorieTarget;
    private String allergies;
}
