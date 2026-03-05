package com.yogifi.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Calls the Python FastAPI pose-service (port 8001) via WebClient.
 * Spring Boot acts as a proxy: client → Spring Boot → Python service.
 *
 * All methods are non-blocking: they return CompletableFuture so Spring MVC
 * can process other requests while waiting for the Python service response.
 * No .block() calls — those would tie up servlet threads under load.
 */
@Service
@Slf4j
public class PoseAnalysisService {

    private static final Duration TIMEOUT = Duration.ofSeconds(10);

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
     * Returns a CompletableFuture — the servlet thread is freed immediately.
     */
    public CompletableFuture<Map<String, Object>> analyzeFrame(
            String base64Frame, String sessionId) {

        Map<String, Object> payload = new HashMap<>();
        payload.put("frame", base64Frame);
        if (sessionId != null) {
            payload.put("session_id", sessionId);
        }

        return webClient.post()
                .uri("/analyze-frame")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(TIMEOUT)
                .map(result -> result != null ? result
                        : buildErrorResponse("Empty response from pose service"))
                .onErrorResume(WebClientResponseException.class, e -> {
                    log.error("Pose service HTTP error: {} — {}", e.getStatusCode(),
                            e.getResponseBodyAsString());
                    return Mono.just(buildErrorResponse("Pose service error: " + e.getStatusCode()));
                })
                .onErrorResume(e -> {
                    log.error("Pose service unreachable: {}", e.getMessage());
                    return Mono.just(buildErrorResponse("Pose service unavailable"));
                })
                .toFuture();
    }

    /**
     * Fetch the list of supported pose names from the Python service.
     * Falls back to a hardcoded list if the service is unreachable.
     */
    public CompletableFuture<List<String>> getSupportedPoses() {
        List<String> fallback = List.of("warrior_1", "warrior_2", "tree_pose",
                "downward_dog", "child_pose", "goddess", "plank");

        return webClient.get()
                .uri("/poses")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(TIMEOUT)
                .map(result -> {
                    if (result != null && result.containsKey("poses")) {
                        @SuppressWarnings("unchecked")
                        List<String> poses = (List<String>) result.get("poses");
                        return poses;
                    }
                    return fallback;
                })
                .onErrorResume(e -> {
                    log.warn("Could not fetch poses from pose service: {}", e.getMessage());
                    return Mono.just(fallback);
                })
                .toFuture();
    }

    /**
     * Health-check the Python service.
     */
    public CompletableFuture<Boolean> isPoseServiceHealthy() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(3))
                .map(result -> result != null && "ok".equals(result.get("status")))
                .onErrorResume(e -> Mono.just(false))
                .toFuture();
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
