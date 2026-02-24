package com.yogifi.controller;

import com.yogifi.dto.ApiResponse;
import com.yogifi.service.PoseAnalysisService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Pose detection endpoints that proxy to the Python pose-service (port 8001).
 *
 * All endpoints require a valid JWT (enforced by SecurityConfig).
 *
 * POST /api/pose/analyze-frame
 *   Receives a base64-encoded JPEG from the mobile client, forwards to Python
 *   service for BlazePose extraction + TFLite classification, returns result.
 *
 * GET /api/pose/supported-poses
 *   Returns the list of pose names the ML model was trained on.
 *
 * GET /api/pose/health
 *   Checks if the Python pose-service is running.
 */
@RestController
@RequestMapping("/api/pose")
@RequiredArgsConstructor
@Slf4j
public class PoseAnalysisController {

    private final PoseAnalysisService poseAnalysisService;

    /**
     * POST /api/pose/analyze-frame
     *
     * Request body:
     *   { "frame": "<base64 JPEG>", "sessionId": "<optional>" }
     *
     * Response data:
     *   {
     *     "pose_detected": true,
     *     "pose_name": "warrior_1",
     *     "confidence": 0.92,
     *     "score": 78.5,
     *     "corrections": [{ "joint": "left_knee_angle", "severity": "major", "instruction": "..." }],
     *     "keypoints": [{ "x": 0.5, "y": 0.3, "visibility": 0.9 }, ...],  // 33 landmarks
     *     "supported_pose": true,
     *     "full_body_visible": true
     *   }
     */
    @PostMapping("/analyze-frame")
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeFrame(
            @Valid @RequestBody FrameAnalysisRequest request) {

        log.debug("analyze-frame called, sessionId={}", request.getSessionId());

        Map<String, Object> result = poseAnalysisService.analyzeFrame(
                request.getFrame(),
                request.getSessionId());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * GET /api/pose/supported-poses
     * Returns the list of pose names the TFLite model was trained on.
     */
    @GetMapping("/supported-poses")
    public ResponseEntity<ApiResponse<List<String>>> getSupportedPoses() {
        List<String> poses = poseAnalysisService.getSupportedPoses();
        return ResponseEntity.ok(ApiResponse.success(poses));
    }

    /**
     * GET /api/pose/health
     * Checks connectivity to the Python pose microservice.
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> poseServiceHealth() {
        boolean healthy = poseAnalysisService.isPoseServiceHealthy();
        Map<String, Object> status = Map.of(
                "pose_service_healthy", healthy,
                "pose_service_url", "http://localhost:8001"
        );
        return ResponseEntity.ok(ApiResponse.success(status,
                healthy ? "Pose service is running" : "Pose service is unreachable"));
    }

    // -----------------------------------------------------------------------
    @Data
    public static class FrameAnalysisRequest {
        @NotBlank(message = "Frame data is required")
        private String frame;
        private String sessionId; // optional
    }
}
