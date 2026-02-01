package com.yogifi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChatHistoryResponse {
    private UUID conversationId;
    private String title;
    private LocalDateTime updatedAt;
    private List<MessageDto> messages;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MessageDto {
        private String role;
        private String content;
        private LocalDateTime createdAt;
    }
}
