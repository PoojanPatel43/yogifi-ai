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
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AnthropicService {

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
            log.warn("AI_API_KEY is not set. AI features will not work until a valid API key is configured.");
            apiKey = ""; // Prevent null pointer
        }

        if ("gemini".equalsIgnoreCase(provider) && !apiUrl.contains("?key=") && !apiKey.isBlank()) {
            apiUrl = apiUrl + "?key=" + apiKey;
        }

        WebClient.Builder builder = WebClient.builder().baseUrl(apiUrl);

        if ("anthropic".equalsIgnoreCase(provider)) {
            builder.defaultHeader("x-api-key", apiKey)
                    .defaultHeader("anthropic-version", "2023-06-01")
                    .defaultHeader("Content-Type", "application/json");
        } else if ("gemini".equalsIgnoreCase(provider)) {
            // Gemini uses API key in URL query parameter
            builder.defaultHeader("Content-Type", "application/json");
        }

        this.webClient = builder.build();
    }

    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        try {
            if (webClient == null) {
                throw new IllegalStateException(
                        "AI service is not configured. Please set the AI_API_KEY environment variable.");
            }

            if ("gemini".equalsIgnoreCase(provider)) {
                return chatWithGemini(systemPrompt, messages);
            } else {
                return chatWithAnthropic(systemPrompt, messages);
            }

        } catch (IllegalStateException e) {
            throw e;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("Error calling AI API: {} - Response body: {}", e.getMessage(), e.getResponseBodyAsString());
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            String responseBody = e.getResponseBodyAsString();

            if (msg.contains("401") || msg.contains("Unauthorized") || msg.contains("invalid")) {
                throw new IllegalStateException(
                        "AI service API key is invalid or missing. Please check the AI_API_KEY configuration.");
            }
            if (msg.contains("400") || msg.contains("Bad Request")) {
                throw new RuntimeException("AI service request error: " + responseBody);
            }
            throw new RuntimeException("AI service is temporarily unavailable. Please try again in a moment.");
        } catch (Exception e) {
            log.error("Error calling AI API: {}", e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "Unknown error";
            if (msg.contains("401") || msg.contains("Unauthorized") || msg.contains("invalid")) {
                throw new IllegalStateException(
                        "AI service API key is invalid or missing. Please check the AI_API_KEY configuration.");
            }
            throw new RuntimeException("AI service is temporarily unavailable. Please try again in a moment.");
        }
    }

    private String chatWithGemini(String systemPrompt, List<Map<String, String>> messages) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();

        // Build contents array with system prompt first
        ArrayNode contentsArray = objectMapper.createArrayNode();

        // Add system prompt as first user message
        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "user");
        ArrayNode systemParts = objectMapper.createArrayNode();
        ObjectNode systemPart = objectMapper.createObjectNode();
        systemPart.put("text", systemPrompt);
        systemParts.add(systemPart);
        systemMsg.set("parts", systemParts);
        contentsArray.add(systemMsg);

        // Add conversation messages
        for (Map<String, String> msg : messages) {
            ObjectNode msgNode = objectMapper.createObjectNode();
            String role = msg.get("role");
            msgNode.put("role", "user".equals(role) ? "user" : "model");

            ArrayNode parts = objectMapper.createArrayNode();
            ObjectNode part = objectMapper.createObjectNode();
            part.put("text", msg.get("content"));
            parts.add(part);
            msgNode.set("parts", parts);
            contentsArray.add(msgNode);
        }

        requestBody.set("contents", contentsArray);

        // Add generation config
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("maxOutputTokens", maxTokens);
        generationConfig.put("temperature", 0.7);
        requestBody.set("generationConfig", generationConfig);

        log.debug("Sending request to Gemini API: {}", requestBody.toPrettyString());

        String responseBody = webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        JsonNode response = objectMapper.readTree(responseBody);
        JsonNode candidates = response.get("candidates");
        if (candidates != null && candidates.isArray() && candidates.size() > 0) {
            JsonNode firstCandidate = candidates.get(0);
            JsonNode content = firstCandidate.get("content");
            if (content != null) {
                JsonNode parts = content.get("parts");
                if (parts != null && parts.isArray() && parts.size() > 0) {
                    return parts.get(0).get("text").asText();
                }
            }
        }

        log.warn("Unexpected Gemini response format: {}", responseBody);
        return "I apologize, but I encountered an issue processing your request.";
    }

    private String chatWithAnthropic(String systemPrompt, List<Map<String, String>> messages) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.put("max_tokens", maxTokens);
        requestBody.put("system", systemPrompt);

        ArrayNode messagesArray = objectMapper.createArrayNode();
        for (Map<String, String> msg : messages) {
            ObjectNode msgNode = objectMapper.createObjectNode();
            msgNode.put("role", msg.get("role"));
            msgNode.put("content", msg.get("content"));
            messagesArray.add(msgNode);
        }
        requestBody.set("messages", messagesArray);

        log.debug("Sending request to Anthropic API: {}", requestBody.toPrettyString());

        String responseBody = webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

        JsonNode response = objectMapper.readTree(responseBody);
        JsonNode content = response.get("content");
        if (content != null && content.isArray() && content.size() > 0) {
            return content.get(0).get("text").asText();
        }

        log.warn("Unexpected Anthropic response format: {}", responseBody);
        return "I apologize, but I encountered an issue processing your request.";
    }
}
