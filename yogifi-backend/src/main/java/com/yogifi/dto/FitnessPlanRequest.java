package com.yogifi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class FitnessPlanRequest {
    private String fitnessLevel;
    private String goal;
    private Integer daysPerWeek;
    private String equipment;
}
