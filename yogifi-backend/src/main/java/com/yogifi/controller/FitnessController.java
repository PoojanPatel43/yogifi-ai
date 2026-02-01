package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.service.FitnessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fitness")
@RequiredArgsConstructor
public class FitnessController {

    private final FitnessService fitnessService;

    @PostMapping("/generate-plan")
    public ResponseEntity<ApiResponse<FitnessPlanResponse>> generatePlan(@RequestBody FitnessPlanRequest request) {
        FitnessPlanResponse plan = fitnessService.generatePlan(request);
        return ResponseEntity.ok(ApiResponse.success(plan, "Fitness plan generated successfully"));
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<FitnessPlanResponse>>> getPlans() {
        List<FitnessPlanResponse> plans = fitnessService.getPlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }
}
