package com.yogifi.controller;

import com.yogifi.dto.ApiResponse;
import com.yogifi.service.CoachService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachService coachService;

    /**
     * Generate AI coaching insights for a completed session.
     * POST /api/coach/summary
     * Body: { "sessionId": "UUID" }
     */
    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCoachSummary(
            @RequestBody Map<String, String> body) {

        String sessionIdStr = body.get("sessionId");
        if (sessionIdStr == null || sessionIdStr.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("sessionId is required"));
        }

        UUID sessionId;
        try {
            sessionId = UUID.fromString(sessionIdStr);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid sessionId format"));
        }

        Map<String, Object> insights = coachService.generateInsights(sessionId);
        return ResponseEntity.ok(ApiResponse.success(insights, "Coaching insights generated"));
    }
}
