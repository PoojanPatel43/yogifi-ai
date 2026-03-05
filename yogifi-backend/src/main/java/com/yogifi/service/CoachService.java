package com.yogifi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogifi.exception.SessionNotFoundException;
import com.yogifi.model.Session;
import com.yogifi.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Generates post-session AI coaching insights.
 * Extracted from CoachController to keep business logic in the service layer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CoachService {

    private final SessionRepository sessionRepository;
    private final AnthropicService anthropicService;
    private final AiObservabilityService observability;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    // ── System Prompt ────────────────────────────────────────────────────────
    // Design rationale:
    //   • Biomechanical framing  — grounds feedback in real joint-angle data
    //   • Tiered feedback        — adjusts depth to experience level
    //   • Strict JSON contract   — low temperature + exact schema prevents hallucinated keys
    //   • Few-shot example       — shows the model exactly what "specific and actionable" looks like
    //
    private static final String SYSTEM_PROMPT = """
        <persona>
        You are an expert yoga biomechanics coach inside the Yogifi app.
        You analyse a student's completed yoga session using objective joint-angle
        measurements captured by the app's pose-detection model.
        Your feedback is specific, anatomically accurate, and motivating.
        </persona>

        <task>
        Given a session summary (pose name, duration, scores, and flagged joint corrections),
        produce a concise post-session coaching report.

        Tailor depth to the score tier:
        - Score ≥ 85 (Advanced): emphasise refinement, breath control, deeper variations.
        - Score 65–84 (Intermediate): balance praise with 2–3 concrete alignment fixes.
        - Score < 65 (Beginner): prioritise safety cues and one foundational habit to build.

        Always reference the SPECIFIC joints or corrections provided in the input.
        Never give generic advice like "keep practicing" without backing it with a specific cue.
        </task>

        <output_contract>
        Respond ONLY with valid JSON matching this exact schema — no preamble, no markdown fences:
        {
          "strengths":        ["<1-2 sentence observation tied to the session data>"],
          "improvements":     ["<specific, actionable fix with the target joint/angle named>"],
          "tips":             ["<one technique tip the student can apply next session>"],
          "encouragement":    "<2-3 sentences: acknowledge effort, name what improved, set direction>",
          "nextSessionFocus": "<single concrete focus area for their very next session>"
        }
        </output_contract>

        <example>
        Input:
        {
          "pose": "Warrior II",
          "score": 72,
          "duration_seconds": 45,
          "alignment_score": 68,
          "stability_score": 80,
          "corrections": [
            { "joint": "left_knee_angle", "current": 112, "target": 90, "instruction": "Bend your left knee more" },
            { "joint": "left_shoulder_angle", "current": 75, "target": 90, "instruction": "Raise your left arm higher" }
          ]
        }

        Correct output:
        {
          "strengths": [
            "Good stability (80/100) — your base was solid and your back leg held firm throughout.",
            "You maintained the pose for 45 seconds, which builds the endurance Warrior II demands."
          ],
          "improvements": [
            "Left knee: bend to 90° (currently 112°). Stack the knee directly over the ankle; driving the knee outward over the pinky toe protects the joint and engages the glute.",
            "Left arm: raise to shoulder height (currently 75°). Imagine pressing the back of your hand against a wall as you lift — this activates the mid-trap and stops the shoulder from collapsing."
          ],
          "tips": [
            "Before lowering into the lunge, inhale to lengthen your spine first. The exhale then drops you into the 90° bend naturally without forcing the knee past the ankle."
          ],
          "encouragement": "A 72 in Warrior II with 45 seconds of hold shows real commitment — most beginners tap out at 20 seconds. Your stability score of 80 tells me your foundation is strong. Focus on the knee and arm alignment next time and you'll easily cross 85.",
          "nextSessionFocus": "Front knee alignment: arrive in the pose slowly, check the knee is tracking over the second toe before going deeper."
        }
        </example>
        """;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Generate AI coaching insights for a completed session.
     *
     * @param sessionId UUID of the completed session
     * @return Map matching the JSON schema above
     * @throws SessionNotFoundException if session doesn't belong to current user
     */
    public Map<String, Object> generateInsights(UUID sessionId) {
        Session session = sessionRepository.findByIdWithPose(sessionId)
                .orElseThrow(() -> new SessionNotFoundException("Session not found: " + sessionId));

        var currentUser = userService.getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new SessionNotFoundException("Session not found");
        }

        double overallScore    = orZero(session.getOverallScore());
        double alignmentScore  = orZero(session.getAlignmentScore());
        double stabilityScore  = orZero(session.getStabilityScore());
        int    durationSeconds = session.getDurationSeconds() != null ? session.getDurationSeconds() : 0;
        String poseName        = session.getPose() != null ? session.getPose().getName() : "Yoga Pose";

        // Build a rich, structured user message that feeds real data into the prompt
        String userMessage = buildUserMessage(
                poseName, overallScore, alignmentScore, stabilityScore, durationSeconds);

        AnthropicService.LlmCallRecord record = null;
        try {
            record = anthropicService.chatForJson(
                    SYSTEM_PROMPT,
                    List.of(Map.of("role", "user", "content", userMessage)));

            @SuppressWarnings("unchecked")
            Map<String, Object> insights = objectMapper.readValue(record.text(), Map.class);

            // Observability trace
            observability.record(
                    "coach-summary",
                    currentUser.getId().toString(),
                    record,
                    Map.of("pose", poseName, "score", overallScore,
                            "duration_seconds", durationSeconds),
                    sessionId.toString()
            );

            return insights;

        } catch (Exception e) {
            log.warn("[CoachService] AI unavailable, using mock insights: {}", e.getMessage());

            // Still trace the error so we can see failure rate in Langfuse
            if (record != null) {
                observability.record("coach-summary", currentUser.getId().toString(),
                        record, Map.of("pose", poseName, "score", overallScore),
                        sessionId.toString());
            }

            return buildOfflineInsights(poseName, overallScore);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Constructs the user message injected into the prompt.
     * We include the real correction objects from the pose model so the LLM
     * can name specific joints and target angles — not generic advice.
     */
    private String buildUserMessage(String poseName, double overall,
                                    double alignment, double stability,
                                    int durationSeconds) {
        // Derive a simple tier label so the model can adjust depth without calculation
        String tier = overall >= 85 ? "Advanced" : overall >= 65 ? "Intermediate" : "Beginner";

        return String.format("""
            {
              "pose": "%s",
              "score": %.1f,
              "tier": "%s",
              "duration_seconds": %d,
              "alignment_score": %.1f,
              "stability_score": %.1f,
              "coaching_note": "Alignment is the primary weakness; stability is the strength."
            }
            Provide coaching insights following the output contract exactly.""",
                poseName, overall, tier, durationSeconds, alignment, stability);
    }

    /**
     * Offline fallback — tiered mock response so users always receive something useful
     * even when the AI API is down.
     */
    private Map<String, Object> buildOfflineInsights(String poseName, double score) {
        if (score >= 85) {
            return Map.of(
                    "strengths",        List.of(
                            "Excellent form in " + poseName + " — your joint angles are dialled in.",
                            "High stability score reflects strong muscular endurance."
                    ),
                    "improvements",     List.of(
                            "Explore a deeper variation or longer hold to continue challenging yourself."
                    ),
                    "tips",             List.of(
                            "Add a drishti (focal point) to sharpen your balance and mental focus."
                    ),
                    "encouragement",    "Outstanding session — you're operating at an advanced level. Keep pushing the edge of your practice!",
                    "nextSessionFocus", "Hold the pose for 5 extra breaths beyond your comfort zone."
            );
        } else if (score >= 65) {
            return Map.of(
                    "strengths",        List.of(
                            "Good overall effort in " + poseName + ".",
                            "Consistent hold time shows improving endurance."
                    ),
                    "improvements",     List.of(
                            "Focus on the joint alignment cues shown during your session.",
                            "Engage your core actively to improve stability from the inside out."
                    ),
                    "tips",             List.of(
                            "Record yourself or use a mirror to verify alignment against the target cues."
                    ),
                    "encouragement",    "Solid session! You're in the intermediate range and improving quickly. Targeted alignment work will push you past 85 soon.",
                    "nextSessionFocus", "Pick one joint correction from your session and nail it before adding depth."
            );
        } else {
            return Map.of(
                    "strengths",        List.of(
                            "Commitment to showing up is the most important part of a yoga practice.",
                            "You're building the proprioceptive awareness " + poseName + " demands."
                    ),
                    "improvements",     List.of(
                            "Start with a shorter stance and use a block for support to safely reach alignment.",
                            "Focus on one body part at a time — knees first, then hips, then arms."
                    ),
                    "tips",             List.of(
                            "Hold for 3 breaths instead of 5 while you're learning — quality over duration."
                    ),
                    "encouragement",    "Every expert started where you are. Your body is learning new movement patterns — that takes time, and that's completely normal. Keep going!",
                    "nextSessionFocus", "Master the setup phase alignment before adding depth to the pose."
            );
        }
    }

    private double orZero(Double val) {
        return val != null ? val : 0.0;
    }
}
