package com.yogifi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Unified LLM gateway for Anthropic Claude and Google Gemini.
 *
 * Two call modes:
 *   chat()        – conversational, temperature 0.7, returns raw text
 *   chatForJson() – structured output, temperature 0.1, markdown fences stripped
 *
 * Every call returns an LlmCallRecord that callers can forward to
 * AiObservabilityService for Langfuse tracing.
 */
@Service
@Slf4j
public class AnthropicService {

    // ── Temperature presets ──────────────────────────────────────────────────
    private static final double TEMP_CONVERSATIONAL = 0.7;
    private static final double TEMP_STRUCTURED     = 0.1;   // JSON output

    // ── Context window guard ─────────────────────────────────────────────────
    /** Maximum number of messages to send to the model (most-recent wins). */
    public static final int MAX_HISTORY_MESSAGES = 20;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String provider;

    @Value("${ai.api.model}")
    private String model;

    @Value("${ai.api.max-tokens}")
    private int maxTokens;

    public AnthropicService(
            @Value("${ai.api.provider:gemini}") String provider,
            @Value("${ai.api.url}") String apiUrl,
            @Value("${ai.api.key}") String apiKey,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.provider = provider;

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("AI_API_KEY is not set — AI features will be unavailable.");
            apiKey = "";
        }

        if ("gemini".equalsIgnoreCase(provider) && !apiUrl.contains("?key=") && !apiKey.isBlank()) {
            apiUrl = apiUrl + "?key=" + apiKey;
        }

        WebClient.Builder builder = WebClient.builder().baseUrl(apiUrl);

        if ("anthropic".equalsIgnoreCase(provider)) {
            builder.defaultHeader("x-api-key", apiKey)
                    .defaultHeader("anthropic-version", "2023-06-01")
                    .defaultHeader("Content-Type", "application/json");
        } else {
            builder.defaultHeader("Content-Type", "application/json");
        }

        this.webClient = builder.build();
    }

    // ── Public API ───────────────────────────────────────────────────────────

    /** Conversational call — higher temperature, returns raw text. */
    public LlmCallRecord chat(String systemPrompt, List<Map<String, String>> messages) {
        return call(systemPrompt, messages, TEMP_CONVERSATIONAL);
    }

    /**
     * Structured-output call — low temperature, markdown fences stripped.
     * Use for every prompt that expects JSON back.
     */
    public LlmCallRecord chatForJson(String systemPrompt, List<Map<String, String>> messages) {
        LlmCallRecord record = call(systemPrompt, messages, TEMP_STRUCTURED);
        return record.withText(stripMarkdownFences(record.text()));
    }

    // ── Core dispatch ────────────────────────────────────────────────────────

    private LlmCallRecord call(String systemPrompt,
                               List<Map<String, String>> messages,
                               double temperature) {
        // Trim history to avoid ballooning context
        List<Map<String, String>> trimmed = messages.size() > MAX_HISTORY_MESSAGES
                ? messages.subList(messages.size() - MAX_HISTORY_MESSAGES, messages.size())
                : messages;

        Instant start = Instant.now();
        try {
            String text = "gemini".equalsIgnoreCase(provider)
                    ? callGemini(systemPrompt, trimmed, temperature)
                    : callAnthropic(systemPrompt, trimmed, temperature);

            long latencyMs = Duration.between(start, Instant.now()).toMillis();
            log.debug("[AI] provider={} model={} latency={}ms messages={}",
                    provider, model, latencyMs, trimmed.size());
            return new LlmCallRecord(text, model, provider, latencyMs, null);

        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("[AI] HTTP error {} after {}ms: {}",
                    e.getStatusCode(), Duration.between(start, Instant.now()).toMillis(),
                    e.getResponseBodyAsString());

            if (e.getStatusCode().value() == 401) {
                throw new IllegalStateException(
                        "AI API key is invalid or missing. Check AI_API_KEY.");
            }
            String detail = e.getResponseBodyAsString();
            throw new RuntimeException("AI service error (" + e.getStatusCode() + "): " + detail);

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            long latencyMs = Duration.between(start, Instant.now()).toMillis();
            log.error("[AI] Unexpected error after {}ms: {}", latencyMs, e.getMessage(), e);
            throw new RuntimeException("AI service temporarily unavailable: " + e.getMessage());
        }
    }

    // ── Provider implementations ─────────────────────────────────────────────

    private String callGemini(String systemPrompt,
                               List<Map<String, String>> messages,
                               double temperature) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode contents = objectMapper.createArrayNode();

        // Gemini 1.5+ supports system_instruction as a top-level field.
        // Use it instead of injecting the system prompt as a user turn, which
        // pollutes the conversation history and can confuse the model.
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode sysInstrParts = objectMapper.createArrayNode();
        sysInstrParts.add(objectMapper.createObjectNode().put("text", systemPrompt));
        systemInstruction.set("parts", sysInstrParts);
        body.set("system_instruction", systemInstruction);

        for (Map<String, String> msg : messages) {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("role", "user".equals(msg.get("role")) ? "user" : "model");
            ArrayNode parts = objectMapper.createArrayNode();
            parts.add(objectMapper.createObjectNode().put("text", msg.get("content")));
            node.set("parts", parts);
            contents.add(node);
        }

        body.set("contents", contents);
        ObjectNode genCfg = objectMapper.createObjectNode();
        genCfg.put("maxOutputTokens", maxTokens);
        genCfg.put("temperature", temperature);
        body.set("generationConfig", genCfg);

        String raw = webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        JsonNode resp = objectMapper.readTree(raw);
        JsonNode candidates = resp.get("candidates");
        if (candidates != null && candidates.isArray() && !candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                return parts.get(0).get("text").asText();
            }
        }
        log.warn("[Gemini] Unexpected response format: {}", raw);
        throw new RuntimeException("Unexpected Gemini response format");
    }

    private String callAnthropic(String systemPrompt,
                                  List<Map<String, String>> messages,
                                  double temperature) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("max_tokens", maxTokens);
        body.put("temperature", temperature);
        body.put("system", systemPrompt);

        ArrayNode msgs = objectMapper.createArrayNode();
        for (Map<String, String> msg : messages) {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("role", msg.get("role"));
            node.put("content", msg.get("content"));
            msgs.add(node);
        }
        body.set("messages", msgs);

        String raw = webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        JsonNode resp = objectMapper.readTree(raw);
        JsonNode content = resp.get("content");
        if (content != null && content.isArray() && !content.isEmpty()) {
            return content.get(0).get("text").asText();
        }
        log.warn("[Anthropic] Unexpected response format: {}", raw);
        throw new RuntimeException("Unexpected Anthropic response format");
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    /** Strip ```json ... ``` fences that Gemini sometimes wraps JSON output in. */
    public static String stripMarkdownFences(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceAll("^```[a-zA-Z]*\\s*", "")
                             .replaceAll("\\s*```$", "")
                             .trim();
        }
        return trimmed;
    }

    // ── Value type for observability ─────────────────────────────────────────

    /**
     * Immutable record of a single LLM call — passed to AiObservabilityService
     * for Langfuse tracing.
     */
    public record LlmCallRecord(
            String text,
            String model,
            String provider,
            long latencyMs,
            String error
    ) {
        public LlmCallRecord withText(String newText) {
            return new LlmCallRecord(newText, model, provider, latencyMs, error);
        }
        public boolean isSuccess() { return error == null; }
    }
}
