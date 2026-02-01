package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ChatResponse>> ask(@RequestBody ChatRequest request) {
        ChatResponse response = chatService.ask(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ChatHistoryResponse>>> getHistory() {
        List<ChatHistoryResponse> history = chatService.getHistory();
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
