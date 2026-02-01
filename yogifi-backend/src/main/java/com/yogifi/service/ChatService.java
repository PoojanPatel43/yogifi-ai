package com.yogifi.service;

import com.yogifi.dto.ChatHistoryResponse;
import com.yogifi.dto.ChatRequest;
import com.yogifi.dto.ChatResponse;
import com.yogifi.model.ChatConversation;
import com.yogifi.model.ChatMessage;
import com.yogifi.model.User;
import com.yogifi.repository.ChatConversationRepository;
import com.yogifi.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final AnthropicService anthropicService;
    private final UserService userService;

    private static final String SYSTEM_PROMPT = """
        You are a friendly and knowledgeable AI wellness coach specializing in yoga, fitness, and nutrition.
        You provide helpful, encouraging, and evidence-based advice.
        Keep responses concise but informative. Use a warm, supportive tone.
        If asked about medical conditions, recommend consulting a healthcare professional.
        Format responses with clear structure when giving instructions or lists.
        """;

    @Transactional
    public ChatResponse ask(ChatRequest request) {
        User user = userService.getCurrentUser();

        ChatConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepo.findById(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        } else {
            conversation = ChatConversation.builder()
                .user(user)
                .title(request.getMessage().length() > 50
                    ? request.getMessage().substring(0, 50) + "..."
                    : request.getMessage())
                .build();
            conversation = conversationRepo.save(conversation);
        }

        // Save user message
        ChatMessage userMessage = ChatMessage.builder()
            .conversation(conversation)
            .role(ChatMessage.MessageRole.USER)
            .content(request.getMessage())
            .build();
        messageRepo.save(userMessage);

        // Build message history for context
        List<ChatMessage> history = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        List<Map<String, String>> messages = new ArrayList<>();
        for (ChatMessage msg : history) {
            messages.add(Map.of(
                "role", msg.getRole() == ChatMessage.MessageRole.USER ? "user" : "assistant",
                "content", msg.getContent()
            ));
        }

        // Call AI
        String aiResponse = anthropicService.chat(SYSTEM_PROMPT, messages);

        // Save assistant message
        ChatMessage assistantMessage = ChatMessage.builder()
            .conversation(conversation)
            .role(ChatMessage.MessageRole.ASSISTANT)
            .content(aiResponse)
            .build();
        messageRepo.save(assistantMessage);

        return ChatResponse.builder()
            .conversationId(conversation.getId())
            .message(aiResponse)
            .role("assistant")
            .build();
    }

    public List<ChatHistoryResponse> getHistory() {
        User user = userService.getCurrentUser();
        List<ChatConversation> conversations = conversationRepo.findByUserIdOrderByUpdatedAtDesc(user.getId());

        return conversations.stream().map(conv -> {
            List<ChatMessage> messages = messageRepo.findByConversationIdOrderByCreatedAtAsc(conv.getId());
            return ChatHistoryResponse.builder()
                .conversationId(conv.getId())
                .title(conv.getTitle())
                .updatedAt(conv.getUpdatedAt())
                .messages(messages.stream().map(msg ->
                    ChatHistoryResponse.MessageDto.builder()
                        .role(msg.getRole().name().toLowerCase())
                        .content(msg.getContent())
                        .createdAt(msg.getCreatedAt())
                        .build()
                ).toList())
                .build();
        }).toList();
    }
}
