package com.yogifi.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Calls the Python FastAPI pose-service (port 8001) via WebClient.
 * Spring Boot acts as a proxy: mobile → Spring Boot → Python service.
 */
@Service
@Slf4j
public class PoseAnalysisService {

    private final WebClient webClient;

    public PoseAnalysisService(
            WebClient.Builder webClientBuilder,
            @Value("${pose.service.url:http://localhost:8001}") String poseServiceUrl) {
        this.webClient = webClientBuilder
                .baseUrl(poseServiceUrl)
                .build();
        log.info("PoseAnalysisService → pose service URL: {}", poseServiceUrl);
    }

    /**
     * Send a base64-encoded JPEG frame to the Python service for pose analysis.
     *
     * @param base64Frame  Base64-encoded JPEG (no data-URI prefix)
     * @param sessionId    Optional session ID for logging/future storage
     * @return Raw pose analysis map matching the Python service response shape
     */
    public Map<String, Object> analyzeFrame(String base64Frame, String sessionId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("frame", base64Frame);
            if (sessionId != null) {
                payload.put("session_id", sessionId);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = webClient.post()
                    .uri("/analyze-frame")
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return result != null ? result : buildErrorResponse("Empty response from pose service");

        } catch (WebClientResponseException e) {
            log.error("Pose service HTTP error: {} — {}", e.getStatusCode(), e.getResponseBodyAsString());
            return buildErrorResponse("Pose service error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Pose service unreachable: {}", e.getMessage());
            return buildErrorResponse("Pose service unavailable — is it running on port 8001?");
        }
    }

    /**
     * Fetch the list of supported pose names from the Python service.
     * Falls back to a hardcoded list if the service is unreachable.
     */
    public List<String> getSupportedPoses() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = webClient.get()
                    .uri("/poses")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (result != null && result.containsKey("poses")) {
                @SuppressWarnings("unchecked")
                List<String> poses = (List<String>) result.get("poses");
                return poses;
            }
        } catch (Exception e) {
            log.warn("Could not fetch poses from pose service: {}", e.getMessage());
        }
        // Fallback — matches pose_references.json
        return List.of("warrior_1", "warrior_2", "tree_pose", "downward_dog",
                "child_pose", "goddess", "plank");
    }

    /**
     * Health-check the Python service.
     */
    public boolean isPoseServiceHealthy() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return result != null && "ok".equals(result.get("status"));
        } catch (Exception e) {
            return false;
        }
    }

    // -----------------------------------------------------------------------
    private Map<String, Object> buildErrorResponse(String message) {
        Map<String, Object> r = new HashMap<>();
        r.put("pose_detected", false);
        r.put("pose_name", "");
        r.put("confidence", 0.0);
        r.put("score", 0.0);
        r.put("corrections", List.of());
        r.put("keypoints", List.of());
        r.put("supported_pose", false);
        r.put("full_body_visible", false);
        r.put("error", message);
        return r;
    }
}
