package com.yogifi.controller;

import com.yogifi.dto.ApiResponse;
import com.yogifi.dto.PoseResponse;
import com.yogifi.exception.PoseNotFoundException;
import com.yogifi.model.Pose;
import com.yogifi.repository.PoseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/poses")
@RequiredArgsConstructor
public class PoseController {

    private final PoseRepository poseRepository;

    /**
     * Get all available poses (public endpoint)
     * GET /api/poses/list
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<PoseResponse>>> listPoses() {
        List<PoseResponse> poses = poseRepository.findAllByOrderByDifficultyAscNameAsc()
            .stream()
            .map(PoseResponse::fromEntity)
            .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(poses));
    }

    /**
     * Get poses by difficulty level
     * GET /api/poses/difficulty/{level}
     */
    @GetMapping("/difficulty/{level}")
    public ResponseEntity<ApiResponse<List<PoseResponse>>> getPosesByDifficulty(@PathVariable String level) {
        Pose.Difficulty difficulty;
        try {
            difficulty = Pose.Difficulty.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid difficulty level. Must be BEGINNER, INTERMEDIATE, or ADVANCED"));
        }

        List<PoseResponse> poses = poseRepository.findByDifficulty(difficulty)
            .stream()
            .map(PoseResponse::fromEntity)
            .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(poses));
    }

    /**
     * Get specific pose details
     * GET /api/poses/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PoseResponse>> getPoseById(@PathVariable UUID id) {
        Pose pose = poseRepository.findById(id)
            .orElseThrow(() -> new PoseNotFoundException("Pose not found with id: " + id));

        return ResponseEntity.ok(ApiResponse.success(PoseResponse.fromEntity(pose)));
    }
}
