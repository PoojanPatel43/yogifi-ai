package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Get current user's profile
     * GET /api/user/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile() {
        ProfileResponse profile = userService.getProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    /**
     * Update current user's profile
     * PUT /api/user/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        ProfileResponse profile = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Profile updated successfully"));
    }

    /**
     * Get current user's statistics
     * GET /api/user/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getStats() {
        UserStatsResponse stats = userService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
