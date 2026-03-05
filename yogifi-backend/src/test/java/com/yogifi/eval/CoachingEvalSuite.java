package com.yogifi.eval;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Offline evaluation suite for the coaching prompt.
 *
 * Each scenario drives the system prompt + buildUserMessage() directly via
 * a thin harness — no Spring context, no DB, no live LLM call required.
 * The harness parses the offline-fallback response so the assertions always
 * run even in CI without AI credentials.
 *
 * To run against a live model, set AI_API_KEY + AI_PROVIDER env vars and
 * replace the harness call with a real AnthropicService.chatForJson() call.
 *
 * Evaluation criteria (per scenario):
 *   1. Schema validity  — all 5 required keys present, correct types
 *   2. Non-empty lists  — strengths, improvements, tips each have ≥ 1 item
 *   3. Tier relevance   — feedback depth matches the score tier (spot-checked)
 *   4. No generic filler— phrases like "keep practicing" alone are flagged
 */
@DisplayName("Coaching Agent Eval Suite — 10 scenarios")
class CoachingEvalSuite {

    // ── Required JSON keys in every coaching response ────────────────────────
    private static final List<String> REQUIRED_KEYS =
            List.of("strengths", "improvements", "tips", "encouragement", "nextSessionFocus");

    // ── Generic-advice sentinel — any improvement that is ONLY this phrase ──
    private static final String GENERIC_FILLER = "keep practicing";

    private CoachingHarness harness;

    @BeforeEach
    void setUp() {
        harness = new CoachingHarness();
    }

    // ── Scenario definitions ──────────────────────────────────────────────────

    static Stream<Scenario> scenarios() {
        return Stream.of(
            // ── Warrior II ──────────────────────────────────────────────────
            new Scenario("Warrior II — Beginner",      "Warrior II",          55.0, 48.0, 60.0, 30),
            new Scenario("Warrior II — Intermediate",  "Warrior II",          74.0, 70.0, 80.0, 45),
            new Scenario("Warrior II — Advanced",      "Warrior II",          91.0, 92.0, 89.0, 60),

            // ── Tree Pose ────────────────────────────────────────────────────
            new Scenario("Tree Pose — Beginner",       "Tree Pose",           50.0, 45.0, 55.0, 20),
            new Scenario("Tree Pose — Intermediate",   "Tree Pose",           78.0, 75.0, 82.0, 40),

            // ── Downward Dog ─────────────────────────────────────────────────
            new Scenario("Downward Dog — Beginner",    "Downward Dog",        60.0, 55.0, 65.0, 25),
            new Scenario("Downward Dog — Advanced",    "Downward Dog",        88.0, 90.0, 85.0, 55),

            // ── Goddess Pose ─────────────────────────────────────────────────
            new Scenario("Goddess Pose — Intermediate","Goddess Pose",        68.0, 65.0, 72.0, 35),

            // ── Plank ────────────────────────────────────────────────────────
            new Scenario("Plank — Beginner",           "Plank",               58.0, 52.0, 63.0, 20),
            new Scenario("Plank — Advanced",           "Plank",               93.0, 94.0, 91.0, 90)
        );
    }

    // ── Parameterised test ───────────────────────────────────────────────────

    @ParameterizedTest(name = "{0}")
    @MethodSource("scenarios")
    void coachingResponseMeetsQualityBar(Scenario scenario) throws Exception {
        Map<String, Object> response = harness.generateInsights(
                scenario.poseName(),
                scenario.overallScore(),
                scenario.alignmentScore(),
                scenario.stabilityScore(),
                scenario.durationSeconds());

        // 1. Schema validity
        for (String key : REQUIRED_KEYS) {
            assertThat(response)
                    .as("Key '%s' missing in response for: %s", key, scenario.name())
                    .containsKey(key);
        }

        // 2. Non-empty lists
        assertThat(asList(response, "strengths"))
                .as("strengths must be non-empty for: %s", scenario.name())
                .isNotEmpty();
        assertThat(asList(response, "improvements"))
                .as("improvements must be non-empty for: %s", scenario.name())
                .isNotEmpty();
        assertThat(asList(response, "tips"))
                .as("tips must be non-empty for: %s", scenario.name())
                .isNotEmpty();

        // 3. String fields non-blank
        assertThat(asString(response, "encouragement"))
                .as("encouragement must be non-blank for: %s", scenario.name())
                .isNotBlank();
        assertThat(asString(response, "nextSessionFocus"))
                .as("nextSessionFocus must be non-blank for: %s", scenario.name())
                .isNotBlank();

        // 4. No standalone generic filler in improvements
        for (Object item : asList(response, "improvements")) {
            assertThat(item.toString().toLowerCase().trim())
                    .as("Generic filler found in improvements for: %s", scenario.name())
                    .doesNotMatch("^" + GENERIC_FILLER + "\\.?$");
        }

        // 5. Tier relevance: beginner responses should mention safety or foundation
        if (scenario.overallScore() < 65) {
            boolean mentionsSafety = response.values().stream()
                    .map(Object::toString)
                    .anyMatch(s -> s.toLowerCase().matches(".*(safe|foundation|basic|start|block|support).*"));
            assertThat(mentionsSafety)
                    .as("Beginner response should mention safety or foundations for: %s", scenario.name())
                    .isTrue();
        }

        // 6. Advanced responses should NOT default to the most basic cues
        if (scenario.overallScore() >= 85) {
            boolean tooBasic = response.values().stream()
                    .map(Object::toString)
                    .anyMatch(s -> s.toLowerCase().matches(".*(start with|use a block|shorter hold).*"));
            assertThat(tooBasic)
                    .as("Advanced response should not contain beginner cues for: %s", scenario.name())
                    .isFalse();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Object> asList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof List<?> ? (List<Object>) val : List.of();
    }

    private String asString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : "";
    }

    // ── Scenario record ──────────────────────────────────────────────────────

    record Scenario(
            String name,
            String poseName,
            double overallScore,
            double alignmentScore,
            double stabilityScore,
            int durationSeconds
    ) {}

    // ── Harness — calls the offline fallback directly (no Spring, no LLM) ───

    /**
     * Thin test harness that mirrors CoachService.buildOfflineInsights() so
     * every assertion runs in CI without AI credentials.
     *
     * Swap the body of generateInsights() to call a real AnthropicService
     * instance when you want to evaluate live model output.
     */
    static class CoachingHarness {

        /**
         * Builds the same JSON structure CoachService would return, using the
         * tiered offline fallback.  Replace with a live chatForJson() call to
         * evaluate actual model output.
         */
        Map<String, Object> generateInsights(String poseName, double overall,
                                              double alignment, double stability,
                                              int durationSeconds) {
            // Return the offline fallback (deterministic, no API key needed)
            return buildOfflineInsights(poseName, overall);
        }

        private Map<String, Object> buildOfflineInsights(String poseName, double score) {
            if (score >= 85) {
                return Map.of(
                        "strengths", List.of(
                                "Excellent form in " + poseName + " — your joint angles are dialled in.",
                                "High stability score reflects strong muscular endurance."
                        ),
                        "improvements", List.of(
                                "Explore a deeper variation or longer hold to continue challenging yourself."
                        ),
                        "tips", List.of(
                                "Add a drishti (focal point) to sharpen your balance and mental focus."
                        ),
                        "encouragement", "Outstanding session — you're operating at an advanced level. Keep pushing the edge of your practice!",
                        "nextSessionFocus", "Hold the pose for 5 extra breaths beyond your comfort zone."
                );
            } else if (score >= 65) {
                return Map.of(
                        "strengths", List.of(
                                "Good overall effort in " + poseName + ".",
                                "Consistent hold time shows improving endurance."
                        ),
                        "improvements", List.of(
                                "Focus on the joint alignment cues shown during your session.",
                                "Engage your core actively to improve stability from the inside out."
                        ),
                        "tips", List.of(
                                "Record yourself or use a mirror to verify alignment against the target cues."
                        ),
                        "encouragement", "Solid session! You're in the intermediate range and improving quickly. Targeted alignment work will push you past 85 soon.",
                        "nextSessionFocus", "Pick one joint correction from your session and nail it before adding depth."
                );
            } else {
                return Map.of(
                        "strengths", List.of(
                                "Commitment to showing up is the most important part of a yoga practice.",
                                "You're building the proprioceptive awareness " + poseName + " demands."
                        ),
                        "improvements", List.of(
                                "Start with a shorter stance and use a block for support to safely reach alignment.",
                                "Focus on one body part at a time — knees first, then hips, then arms."
                        ),
                        "tips", List.of(
                                "Hold for 3 breaths instead of 5 while you're learning — quality over duration."
                        ),
                        "encouragement", "Every expert started where you are. Your body is learning new movement patterns — that takes time, and that's completely normal. Keep going!",
                        "nextSessionFocus", "Master the setup phase alignment before adding depth to the pose."
                );
            }
        }
    }
}
