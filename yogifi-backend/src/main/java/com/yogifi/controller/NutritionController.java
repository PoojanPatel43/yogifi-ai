package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.service.NutritionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;

    @PostMapping("/generate-plan")
    public ResponseEntity<ApiResponse<NutritionPlanResponse>> generatePlan(@RequestBody NutritionPlanRequest request) {
        NutritionPlanResponse plan = nutritionService.generatePlan(request);
        return ResponseEntity.ok(ApiResponse.success(plan, "Nutrition plan generated successfully"));
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<NutritionPlanResponse>>> getPlans() {
        List<NutritionPlanResponse> plans = nutritionService.getPlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }
}
