package com.yogifi.controller;

import com.yogifi.dto.ApiResponse;
import com.yogifi.service.PoseAnalysisService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/pose")
@RequiredArgsConstructor
@Slf4j
public class PoseAnalysisController {

    private final PoseAnalysisService poseAnalysisService;

    /**
     * POST /api/pose/analyze-frame
     * Non-blocking: frees the servlet thread while waiting for the Python service.
     */
    @PostMapping("/analyze-frame")
    public CompletableFuture<ResponseEntity<ApiResponse<Map<String, Object>>>> analyzeFrame(
            @Valid @RequestBody FrameAnalysisRequest request) {

        log.debug("analyze-frame called, sessionId={}", request.getSessionId());

        return poseAnalysisService
                .analyzeFrame(request.getFrame(), request.getSessionId())
                .thenApply(result -> ResponseEntity.ok(ApiResponse.success(result)));
    }

    /** GET /api/pose/supported-poses */
    @GetMapping("/supported-poses")
    public CompletableFuture<ResponseEntity<ApiResponse<List<String>>>> getSupportedPoses() {
        return poseAnalysisService
                .getSupportedPoses()
                .thenApply(poses -> ResponseEntity.ok(ApiResponse.success(poses)));
    }

    /** GET /api/pose/health */
    @GetMapping("/health")
    public CompletableFuture<ResponseEntity<ApiResponse<Map<String, Object>>>> poseServiceHealth() {
        return poseAnalysisService
                .isPoseServiceHealthy()
                .thenApply(healthy -> {
                    Map<String, Object> status = Map.of(
                            "pose_service_healthy", healthy,
                            "pose_service_url", "http://localhost:8001"
                    );
                    return ResponseEntity.ok(ApiResponse.success(status,
                            healthy ? "Pose service is running" : "Pose service is unreachable"));
                });
    }

    // -----------------------------------------------------------------------
    @Data
    public static class FrameAnalysisRequest {
        @NotBlank(message = "Frame data is required")
        @Size(max = 2_097_152, message = "Frame payload too large (max 2 MB base64)")
        private String frame;

        @Size(max = 36, message = "Invalid sessionId")
        private String sessionId;
    }
}
