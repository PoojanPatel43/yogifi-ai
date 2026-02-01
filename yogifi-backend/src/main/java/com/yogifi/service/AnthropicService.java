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

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AnthropicService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${anthropic.api.model}")
    private String model;

    @Value("${anthropic.api.max-tokens}")
    private int maxTokens;

    public AnthropicService(
            @Value("${anthropic.api.url}") String apiUrl,
            @Value("${anthropic.api.key}") String apiKey,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(apiUrl)
            .defaultHeader("x-api-key", apiKey)
            .defaultHeader("anthropic-version", "2023-06-01")
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        try {
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

            String responseBody = webClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody.toString())
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode response = objectMapper.readTree(responseBody);
            JsonNode content = response.get("content");
            if (content != null && content.isArray() && content.size() > 0) {
                return content.get(0).get("text").asText();
            }

            log.warn("Unexpected Anthropic response format: {}", responseBody);
            return "I apologize, but I encountered an issue processing your request.";

        } catch (Exception e) {
            log.error("Error calling Anthropic API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get AI response: " + e.getMessage());
        }
    }
}
