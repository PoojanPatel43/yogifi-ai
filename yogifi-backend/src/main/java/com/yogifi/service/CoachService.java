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
        You analyse a student's completed yoga session using objective data captured
        by the app's BlazePose + TFLite pose-detection model:
        alignment scores, stability scores, and flagged joint corrections with severity ratings.
        Your feedback is specific, anatomically grounded, and motivating — never generic.
        </persona>

        <task>
        Given a session summary, produce a concise post-session coaching report.

        Tailor depth to the score tier supplied in the input:
        - Advanced  (≥ 85): emphasise refinement, breath integration, deeper variations.
        - Intermediate (65–84): balance praise with 2–3 concrete, joint-specific alignment fixes.
        - Beginner  (< 65): prioritise one safety cue and one foundational habit to build this week.

        Rules:
        1. Reference SPECIFIC joints and corrections from the input — never invent corrections not listed.
        2. If duration_seconds is included for a correction, mention how long the issue persisted.
        3. Never say "keep practicing" without pairing it with a specific next action.
        4. Strengths must be grounded in the numeric scores, not assumed.
        </task>

        <output_contract>
        Respond ONLY with valid JSON matching this exact schema — no preamble, no markdown fences:
        {
          "strengths":        ["<1-2 sentence observation tied to the session scores/data>"],
          "improvements":     ["<actionable fix naming the specific joint and what to do>"],
          "tips":             ["<one technique the student can try in their very next session>"],
          "encouragement":    "<2-3 sentences: acknowledge effort, reference the score, set a direction>",
          "nextSessionFocus": "<single, specific focus area for the next session>"
        }
        Array fields: strengths 1–3 items, improvements 1–3 items, tips exactly 1 item.
        </output_contract>

        <example>
        Input:
        {
          "pose": "Warrior II",
          "score": 72,
          "tier": "Intermediate",
          "duration_seconds": 45,
          "alignment_score": 68,
          "stability_score": 80,
          "corrections": [
            { "joint": "left_knee", "severity": "high", "instruction": "Bend your left knee more toward 90°", "duration_seconds": 30 },
            { "joint": "left_shoulder", "severity": "medium", "instruction": "Raise your left arm to shoulder height" }
          ]
        }

        Correct output:
        {
          "strengths": [
            "Solid stability (80/100) — your back leg held firm and your base didn't waver.",
            "45-second hold in Warrior II is strong; intermediate students typically manage 30 seconds."
          ],
          "improvements": [
            "Left knee: bend deeper toward 90° — this was flagged for 30 of your 45 seconds. Drive the knee outward over your pinky toe to protect the joint and engage the glute fully.",
            "Left arm: raise to shoulder height. Think of pressing the back of your hand against a wall as you lift — this recruits the mid-trap and prevents the shoulder from collapsing."
          ],
          "tips": [
            "Inhale to lengthen your spine before lowering into the lunge. The exhale then drops you into the bend naturally, making it easier to hit 90° without forcing the knee past the ankle."
          ],
          "encouragement": "A 72 with 45 seconds of hold is genuine Warrior II work — most intermediates struggle past 30. Your stability foundation is strong at 80. Nail the knee alignment and you'll clear 85 next session.",
          "nextSessionFocus": "Left knee depth: set up in Warrior II slowly, confirm the knee tracks over the second toe before adding depth."
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

        // Load mistakes in a separate query to avoid MultipleBagFetchException
        java.util.List<com.yogifi.model.PoseMistake> mistakes =
                sessionRepository.findByIdWithMistakes(sessionId)
                        .map(s -> s.getMistakes())
                        .orElse(java.util.List.of());

        // Build a rich, structured user message that feeds real data into the prompt
        String userMessage = buildUserMessage(
                poseName, overallScore, alignmentScore, stabilityScore, durationSeconds, mistakes);

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
     * Includes real PoseMistake records so the LLM can name specific joints
     * and target angles rather than producing generic advice.
     */
    private String buildUserMessage(String poseName, double overall,
                                    double alignment, double stability,
                                    int durationSeconds,
                                    java.util.List<com.yogifi.model.PoseMistake> mistakes) {
        // Derive a simple tier label so the model can adjust depth without calculation
        String tier = overall >= 85 ? "Advanced" : overall >= 65 ? "Intermediate" : "Beginner";

        // Serialize up to 5 highest-severity corrections into the prompt.
        // Ordering: CRITICAL > HIGH > MEDIUM > LOW — take the most impactful ones.
        java.util.List<com.yogifi.model.PoseMistake> topMistakes = mistakes.stream()
                .sorted(java.util.Comparator.comparingInt(m -> {
                    return switch (m.getSeverity()) {
                        case CRITICAL -> 0;
                        case HIGH     -> 1;
                        case MEDIUM   -> 2;
                        case LOW      -> 3;
                    };
                }))
                .limit(5)
                .toList();

        StringBuilder correctionsJson = new StringBuilder("[");
        for (int i = 0; i < topMistakes.size(); i++) {
            com.yogifi.model.PoseMistake m = topMistakes.get(i);
            if (i > 0) correctionsJson.append(",");
            String instruction = m.getCorrection() != null
                    ? m.getCorrection().replace("\"", "'")
                    : m.getDescription() != null
                            ? m.getDescription().replace("\"", "'")
                            : m.getMistakeType();
            // Include duration_seconds so the LLM can reference how long the mistake persisted
            String durField = m.getDurationSeconds() != null
                    ? String.format(",\"duration_seconds\":%.0f", m.getDurationSeconds())
                    : "";
            // Include measured/target angles when available so the LLM can give precise cues
            String angleFields = "";
            if (m.getCurrentAngle() != null) {
                angleFields += String.format(",\"current_angle\":%.1f", m.getCurrentAngle());
            }
            if (m.getTargetAngle() != null) {
                angleFields += String.format(",\"target_angle\":%.1f", m.getTargetAngle());
            }
            correctionsJson.append(String.format(
                    "{\"joint\":\"%s\",\"severity\":\"%s\",\"instruction\":\"%s\"%s%s}",
                    m.getJoint(),
                    m.getSeverity().name().toLowerCase(),
                    instruction,
                    durField,
                    angleFields
            ));
        }
        correctionsJson.append("]");

        return String.format("""
            {
              "pose": "%s",
              "score": %.1f,
              "tier": "%s",
              "duration_seconds": %d,
              "alignment_score": %.1f,
              "stability_score": %.1f,
              "corrections": %s
            }
            Provide coaching insights following the output contract exactly.""",
                poseName, overall, tier, durationSeconds, alignment, stability,
                correctionsJson);
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
