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
    private final AiObservabilityService observability;
    private final UserService userService;

    // ── System Prompt ─────────────────────────────────────────────────────────
    // Structured in four sections that LLMs respond to reliably:
    //   1. Persona        – who the model is
    //   2. Domain scope   – what it knows / doesn't cover
    //   3. Output format  – how to structure replies
    //   4. Few-shot pairs – concrete examples to anchor tone and depth
    //
    private static final String SYSTEM_PROMPT = """
        <persona>
        You are Yogi, an empathetic AI wellness coach inside the Yogifi app.
        You specialise in yoga technique, mindful movement, breathwork,
        functional fitness, and evidence-based nutrition for active lifestyles.
        Your tone is warm, encouraging, and precise — like a knowledgeable friend
        who happens to be a certified yoga instructor (RYT-500) and personal trainer (NASM-CPT).
        </persona>

        <scope>
        Answer questions about:
        - Yoga poses, alignment cues, modifications, progressions, contraindications
        - Breathwork (pranayama) and meditation techniques
        - Workout programming and recovery
        - Nutrition for yoga practitioners and athletes
        - Mental wellness and stress management related to movement

        If asked about acute injuries, chronic medical conditions, or medication,
        acknowledge the question empathetically then recommend the user consult a
        qualified healthcare professional before continuing practice.

        Do NOT answer questions unrelated to health, fitness, or wellness.
        Politely redirect: "That's outside my area of expertise as a yoga coach,
        but I'd love to help you with your practice!"
        </scope>

        <output_format>
        - Default: 2–4 sentences for simple questions; bullet lists for multi-step guidance.
        - For pose instructions: use a numbered step list.
        - For workout plans: use a structured table or day-by-day format.
        - Always end with one motivating sentence when the user seems discouraged.
        - Never use jargon without defining it on first use.
        </output_format>

        <examples>
        User: My lower back hurts during Warrior II. What am I doing wrong?
        Yogi: Lower-back discomfort in Warrior II usually comes from one of two places:
        the pelvis tilting forward (anterior tilt) or the front knee collapsing inward.
        Try these fixes: (1) Engage your core and draw your tailbone down toward the floor.
        (2) Press your front knee outward so it tracks over your second toe.
        (3) Shorten your stance slightly if the hip flexors feel strained.
        If the pain is sharp or radiates down the leg, rest and see a physio before continuing. 💪

        User: How long should I hold each pose for a beginner?
        Yogi: As a beginner, aim for **5–8 slow breaths** per pose (roughly 30–45 seconds).
        This builds body awareness without overloading muscles or joints.
        Progress to 60–90 seconds once you feel stable and can maintain alignment without struggle.
        Consistency beats duration — a daily 20-minute session outperforms occasional long sessions.

        User: What should I eat before a morning yoga session?
        Yogi: Practice on a mostly empty stomach — yoga involves twists and inversions that are
        uncomfortable with a full belly. A small snack 30–60 min before is fine if you need energy:
        try a banana, a few dates, or a small handful of nuts. Hydrate well the night before and
        sip water on waking. Save your main meal for 30–60 minutes after practice.
        </examples>
        """;

    // ── Public API ─────────────────────────────────────────────────────────────

    @Transactional
    public ChatResponse ask(ChatRequest request) {
        User user = userService.getCurrentUser();

        // Resolve or create conversation
        ChatConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepo.findById(request.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));
        } else {
            String title = request.getMessage().length() > 60
                    ? request.getMessage().substring(0, 60) + "…"
                    : request.getMessage();
            conversation = conversationRepo.save(
                    ChatConversation.builder().user(user).title(title).build());
        }

        // Persist user message
        messageRepo.save(ChatMessage.builder()
                .conversation(conversation)
                .role(ChatMessage.MessageRole.USER)
                .content(request.getMessage())
                .build());

        // Build context window — most-recent MAX_HISTORY_MESSAGES messages
        List<ChatMessage> history = messageRepo
                .findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        int start = Math.max(0, history.size() - AnthropicService.MAX_HISTORY_MESSAGES);
        List<Map<String, String>> messages = new ArrayList<>();
        for (ChatMessage msg : history.subList(start, history.size())) {
            messages.add(Map.of(
                    "role",    msg.getRole() == ChatMessage.MessageRole.USER ? "user" : "assistant",
                    "content", msg.getContent()
            ));
        }

        // LLM call
        String aiResponse;
        AnthropicService.LlmCallRecord record = null;
        try {
            record = anthropicService.chat(SYSTEM_PROMPT, messages);
            aiResponse = record.text();
        } catch (Exception e) {
            log.warn("[ChatService] AI unavailable, using offline fallback: {}", e.getMessage());
            aiResponse = "I'm temporarily offline. "
                    + "Quick tip: in yoga, breath leads movement — "
                    + "every inhale creates space, every exhale deepens the pose. "
                    + "Please try again in a moment! 🙏";
        }

        // Persist assistant reply
        messageRepo.save(ChatMessage.builder()
                .conversation(conversation)
                .role(ChatMessage.MessageRole.ASSISTANT)
                .content(aiResponse)
                .build());

        // Observability trace (fire-and-forget)
        if (record != null) {
            observability.record(
                    "chat-coaching",
                    user.getId().toString(),
                    record,
                    Map.of("message", request.getMessage(),
                           "conversationId", conversation.getId().toString()),
                    conversation.getId().toString()
            );
        }

        return ChatResponse.builder()
                .conversationId(conversation.getId())
                .message(aiResponse)
                .role("assistant")
                .build();
    }

    public List<ChatHistoryResponse> getHistory() {
        User user = userService.getCurrentUser();
        return conversationRepo.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(conv -> {
                    List<ChatMessage> msgs = messageRepo
                            .findByConversationIdOrderByCreatedAtAsc(conv.getId());
                    return ChatHistoryResponse.builder()
                            .conversationId(conv.getId())
                            .title(conv.getTitle())
                            .updatedAt(conv.getUpdatedAt())
                            .messages(msgs.stream()
                                    .map(m -> ChatHistoryResponse.MessageDto.builder()
                                            .role(m.getRole().name().toLowerCase())
                                            .content(m.getContent())
                                            .createdAt(m.getCreatedAt())
                                            .build())
                                    .toList())
                            .build();
                })
                .toList();
    }
}
