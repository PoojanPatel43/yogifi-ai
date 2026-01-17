package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * Start a new yoga session
     * POST /api/session/start
     */
    @PostMapping("/start")
    public ResponseEntity<ApiResponse<SessionResponse>> startSession(@Valid @RequestBody SessionStartRequest request) {
        SessionResponse session = sessionService.startSession(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(session, "Session started successfully"));
    }

    /**
     * End an active session with results
     * POST /api/session/end
     */
    @PostMapping("/end")
    public ResponseEntity<ApiResponse<SessionResponse>> endSession(@Valid @RequestBody SessionEndRequest request) {
        SessionResponse session = sessionService.endSession(request);
        return ResponseEntity.ok(ApiResponse.success(session, "Session completed successfully"));
    }

    /**
     * Get user's session history
     * GET /api/session/history?limit=10&offset=0
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessionHistory(
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(defaultValue = "0") int offset
    ) {
        List<SessionResponse> sessions = sessionService.getSessionHistory(limit, offset);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    /**
     * Get detailed session data
     * GET /api/session/{sessionId}
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionResponse>> getSession(@PathVariable UUID sessionId) {
        SessionResponse session = sessionService.getSessionById(sessionId);
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    /**
     * Cancel an active session
     * POST /api/session/{sessionId}/cancel
     */
    @PostMapping("/{sessionId}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelSession(@PathVariable UUID sessionId) {
        sessionService.cancelSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Session cancelled"));
    }
}
