package com.yogifi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.UUID;

/**
 * Sends LLM call traces to Langfuse via its ingestion REST API.
 *
 * Each call to {@link #record} fires-and-forgets one batch containing:
 *   - a trace (top-level grouping for a user interaction)
 *   - a generation (the individual LLM request/response)
 *
 * Langfuse dashboard: https://cloud.langfuse.com
 *
 * Required environment variables:
 *   LANGFUSE_PUBLIC_KEY  – pk-lf-...
 *   LANGFUSE_SECRET_KEY  – sk-lf-...
 *   LANGFUSE_HOST        – https://cloud.langfuse.com  (default)
 *
 * If keys are not set the service silently no-ops so dev environments
 * without Langfuse still work normally.
 */
@Service
@Slf4j
public class AiObservabilityService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    private final WebClient langfuseClient;
    private final ObjectMapper mapper;
    private final boolean enabled;

    public AiObservabilityService(
            ObjectMapper mapper,
            @Value("${langfuse.public-key:}") String publicKey,
            @Value("${langfuse.secret-key:}") String secretKey,
            @Value("${langfuse.host:https://cloud.langfuse.com}") String host) {

        this.mapper = mapper;

        if (publicKey.isBlank() || secretKey.isBlank()) {
            log.info("[Observability] Langfuse keys not set — tracing disabled.");
            this.langfuseClient = null;
            this.enabled = false;
        } else {
            String credentials = Base64.getEncoder()
                    .encodeToString((publicKey + ":" + secretKey).getBytes());
            this.langfuseClient = WebClient.builder()
                    .baseUrl(host)
                    .defaultHeader("Authorization", "Basic " + credentials)
                    .defaultHeader("Content-Type", "application/json")
                    .build();
            this.enabled = true;
            log.info("[Observability] Langfuse tracing enabled → {}", host);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Record a single LLM call to Langfuse.
     *
     * @param traceName  human-readable name for this interaction
     *                   e.g. "chat-coaching", "coach-summary", "fitness-plan"
     * @param userId     authenticated user ID (for per-user metrics)
     * @param callRecord the result returned by AnthropicService
     * @param input      the user prompt / request object that was sent
     * @param sessionId  optional active session ID for grouping
     */
    public void record(String traceName,
                       String userId,
                       AnthropicService.LlmCallRecord callRecord,
                       Object input,
                       String sessionId) {
        if (!enabled) return;

        try {
            String traceId      = UUID.randomUUID().toString();
            String generationId = UUID.randomUUID().toString();
            String now          = ISO.format(Instant.now());
            String startTime    = ISO.format(
                    Instant.now().minusMillis(callRecord.latencyMs()));

            ObjectNode batch = buildBatch(
                    traceId, generationId, traceName, userId,
                    callRecord, input, sessionId, startTime, now);

            langfuseClient.post()
                    .uri("/api/public/ingestion")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(batch)
                    .retrieve()
                    .bodyToMono(String.class)
                    .subscribe(
                            r -> log.debug("[Observability] Trace {} sent ({})", traceId, traceName),
                            e -> log.warn("[Observability] Failed to send trace: {}", e.getMessage())
                    );
        } catch (Exception e) {
            // Never let observability break the main request path
            log.warn("[Observability] Unexpected error building trace: {}", e.getMessage());
        }
    }

    // ── Builder helpers ───────────────────────────────────────────────────────

    private ObjectNode buildBatch(String traceId, String generationId,
                                   String traceName, String userId,
                                   AnthropicService.LlmCallRecord callRecord,
                                   Object input, String sessionId,
                                   String startTime, String endTime) throws Exception {

        ObjectNode batch = mapper.createObjectNode();
        ArrayNode events = mapper.createArrayNode();

        // ── trace-create ──────────────────────────────────────────────────────
        ObjectNode traceEvent = mapper.createObjectNode();
        traceEvent.put("id",   UUID.randomUUID().toString());
        traceEvent.put("type", "trace-create");
        traceEvent.put("timestamp", endTime);

        ObjectNode traceBody = mapper.createObjectNode();
        traceBody.put("id",        traceId);
        traceBody.put("name",      traceName);
        traceBody.put("userId",    userId != null ? userId : "anonymous");
        if (sessionId != null) {
            traceBody.put("sessionId", sessionId);
        }
        traceBody.put("timestamp", startTime);

        // Metadata: provider, model, latency
        ObjectNode meta = mapper.createObjectNode();
        meta.put("provider",   callRecord.provider());
        meta.put("model",      callRecord.model());
        meta.put("latency_ms", callRecord.latencyMs());
        traceBody.set("metadata", meta);

        traceEvent.set("body", traceBody);
        events.add(traceEvent);

        // ── generation-create ─────────────────────────────────────────────────
        ObjectNode genEvent = mapper.createObjectNode();
        genEvent.put("id",   UUID.randomUUID().toString());
        genEvent.put("type", "generation-create");
        genEvent.put("timestamp", endTime);

        ObjectNode genBody = mapper.createObjectNode();
        genBody.put("id",        generationId);
        genBody.put("traceId",   traceId);
        genBody.put("name",      traceName + "-generation");
        genBody.put("model",     callRecord.model());
        genBody.put("startTime", startTime);
        genBody.put("endTime",   endTime);

        // Input
        genBody.set("input", mapper.valueToTree(input));

        // Output — truncate to avoid huge payloads in the dashboard
        String outputText = callRecord.text();
        if (outputText != null && outputText.length() > 4000) {
            outputText = outputText.substring(0, 4000) + "…[truncated]";
        }
        genBody.put("output", outputText);

        if (callRecord.error() != null) {
            genBody.put("level", "ERROR");
            genBody.put("statusMessage", callRecord.error());
        } else {
            genBody.put("level", "DEFAULT");
        }

        genEvent.set("body", genBody);
        events.add(genEvent);

        batch.set("batch", events);
        return batch;
    }
}
