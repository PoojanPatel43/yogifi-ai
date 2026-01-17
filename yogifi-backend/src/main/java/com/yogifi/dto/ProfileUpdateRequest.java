package com.yogifi.dto;

import com.yogifi.model.UserProfile;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Min(value = 13, message = "Age must be at least 13")
    @Max(value = 120, message = "Age must be less than 120")
    private Integer age;

    @Min(value = 50, message = "Height must be at least 50 cm")
    @Max(value = 300, message = "Height must be less than 300 cm")
    private Double height; // in cm

    @Min(value = 20, message = "Weight must be at least 20 kg")
    @Max(value = 500, message = "Weight must be less than 500 kg")
    private Double weight; // in kg

    private UserProfile.FitnessLevel fitnessLevel;

    private String goals; // JSON string

    private String avatarUrl;
}
