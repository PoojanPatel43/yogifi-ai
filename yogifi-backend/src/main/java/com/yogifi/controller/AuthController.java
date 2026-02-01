package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        log.info("Registration attempt for email: {}", email);

        if (!isValidEmail(email)) {
            log.warn("Registration rejected - invalid email format: {}", email);
            return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("Please provide a valid email address"));
        }

        String password = request.getPassword() != null ? request.getPassword() : "";
        if (!isStrongPassword(password)) {
            log.warn("Registration rejected - weak password for email: {}", email);
            return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("Password must be at least 8 characters with at least one number and one special character"));
        }

        try {
            AuthResponse response = authService.register(request);
            log.info("Registration successful for email: {}", email);
            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
        } catch (DataIntegrityViolationException e) {
            log.warn("Registration failed - duplicate email: {}", email);
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("An account with this email already exists"));
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed - validation error for {}: {}", email, e.getMessage());
            return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Registration failed - unexpected error for {}: {}", email, e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Registration failed. Please try again later."));
        }
    }

    /**
     * Login with email and password
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        log.info("Login attempt for email: {}", email);

        try {
            AuthResponse response = authService.login(request);
            log.info("Login successful for email: {}", email);
            return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
        } catch (BadCredentialsException e) {
            log.warn("Login failed - invalid credentials for email: {}", email);
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
        } catch (Exception e) {
            log.error("Login failed - unexpected error for {}: {}", email, e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Login failed. Please try again later."));
        }
    }

    /**
     * Refresh access token using refresh token
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh attempt");
        try {
            AuthResponse response = authService.refreshToken(request);
            log.info("Token refresh successful");
            return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
        } catch (Exception e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid or expired refresh token"));
        }
    }

    /**
     * Logout (client-side token invalidation)
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        log.info("Logout request received");
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) return false;
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    private boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasNumber = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        return hasNumber && hasSpecial;
    }
}
