package com.yogifi.controller;

import com.yogifi.dto.ApiResponse;
import com.yogifi.exception.SessionNotFoundException;
import com.yogifi.model.Session;
import com.yogifi.repository.SessionRepository;
import com.yogifi.service.AnthropicService;
import com.yogifi.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
@Slf4j
public class CoachController {

    private final SessionRepository sessionRepository;
    private final AnthropicService anthropicService;
    private final UserService userService;

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

        Session session = sessionRepository.findByIdWithPose(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        // Verify session belongs to current user
        var currentUser = userService.getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new SessionNotFoundException("Session not found");
        }

        double overallScore  = session.getOverallScore()   != null ? session.getOverallScore()   : 0;
        double alignScore    = session.getAlignmentScore() != null ? session.getAlignmentScore() : 0;
        double stabilityScore = session.getStabilityScore() != null ? session.getStabilityScore() : 0;
        String poseName      = session.getPose() != null ? session.getPose().getName() : "Unknown Pose";

        try {
            String systemPrompt = """
                You are an expert yoga coach providing personalized feedback after a session.
                Be encouraging, specific, and actionable. Keep each point concise (1-2 sentences).
                Always respond in valid JSON with this exact structure:
                {
                  "strengths": ["string", "string"],
                  "improvements": ["string", "string"],
                  "tips": ["string"],
                  "encouragement": "string",
                  "nextSessionFocus": "string"
                }
                """;

            String userMessage = String.format(
                "Analyze this yoga session for %s:\n" +
                "- Overall score: %.1f/100\n" +
                "- Alignment score: %.1f/100\n" +
                "- Stability score: %.1f/100\n" +
                "- Duration: %d seconds\n" +
                "Provide coaching insights as JSON.",
                poseName, overallScore, alignScore, stabilityScore,
                session.getDurationSeconds() != null ? session.getDurationSeconds() : 0
            );

            String aiResponse = anthropicService.chat(systemPrompt,
                    List.of(Map.of("role", "user", "content", userMessage)));

            // Strip markdown code fences that Gemini sometimes wraps JSON in (```json ... ```)
            String jsonStr = aiResponse.trim();
            if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replaceAll("^```[a-zA-Z]*\\s*", "").replaceAll("\\s*```$", "").trim();
            }

            // Parse the AI JSON response and return it
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> insights = mapper.readValue(jsonStr, Map.class);

            return ResponseEntity.ok(ApiResponse.success(insights, "Coaching insights generated"));

        } catch (Exception e) {
            log.warn("AI coaching unavailable, returning structured mock insights: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.success(buildMockInsights(poseName, overallScore),
                    "Coaching insights (offline mode)"));
        }
    }

    private Map<String, Object> buildMockInsights(String poseName, double score) {
        if (score >= 85) {
            return Map.of(
                "strengths", List.of("Excellent form for " + poseName, "Great stability and balance throughout the session"),
                "improvements", List.of("Focus on deepening the pose", "Try holding for longer durations"),
                "tips", List.of("Breathe deeply into tight areas to release tension"),
                "encouragement", "Outstanding session! You're mastering this pose beautifully.",
                "nextSessionFocus", "Challenge yourself with intermediate variations"
            );
        } else if (score >= 70) {
            return Map.of(
                "strengths", List.of("Good overall alignment in " + poseName, "Consistent effort throughout"),
                "improvements", List.of("Work on joint angle precision", "Improve core engagement"),
                "tips", List.of("Use a mirror or video to check alignment cues"),
                "encouragement", "Great progress! Keep practicing and you'll see rapid improvement.",
                "nextSessionFocus", "Focus on the alignment cues shown in your session feedback"
            );
        } else {
            return Map.of(
                "strengths", List.of("Commitment to practice", "Building the foundation for " + poseName),
                "improvements", List.of("Review the setup phase guidance", "Focus on one alignment point at a time"),
                "tips", List.of("Start with shorter holds and build up gradually"),
                "encouragement", "Every practice brings growth. You're building a strong foundation!",
                "nextSessionFocus", "Master the basic alignment before adding depth"
            );
        }
    }
}
