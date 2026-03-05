package com.yogifi.controller;

import com.yogifi.dto.*;
import com.yogifi.exception.InvalidCredentialsException;
import com.yogifi.exception.UserAlreadyExistsException;
import com.yogifi.service.AuthService;
import com.yogifi.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final AuthService authService;
    private final JwtService jwtService;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    /**
     * Register a new user.
     * Sets refresh_token as httpOnly cookie; returns access token in JSON body.
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse httpResponse) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        log.info("Registration attempt [user:{}]", email.hashCode());

        if (!isValidEmail(email)) {
            return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("Please provide a valid email address"));
        }

        String password = request.getPassword() != null ? request.getPassword() : "";
        if (!isStrongPassword(password)) {
            return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("Password must be at least 8 characters with at least one number and one special character"));
        }

        try {
            AuthResponse response = authService.register(request);
            addRefreshCookie(httpResponse, response.getRefreshToken());
            log.info("Registration successful [user:{}]", email.hashCode());
            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("An account with this email already exists"));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("An account with this email already exists"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Registration failed - unexpected error: {}", e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Registration failed. Please try again later."));
        }
    }

    /**
     * Login with email and password.
     * Sets refresh_token as httpOnly cookie; returns access token in JSON body.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse) {
        log.info("Login attempt [user:{}]",
            request.getEmail() != null ? request.getEmail().hashCode() : "null");

        try {
            AuthResponse response = authService.login(request);
            addRefreshCookie(httpResponse, response.getRefreshToken());
            log.info("Login successful [user:{}]", response.getUser().getId().hashCode());
            return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
        } catch (InvalidCredentialsException | BadCredentialsException e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
        } catch (Exception e) {
            log.error("Login failed - unexpected error: {}", e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Login failed. Please try again later."));
        }
    }

    /**
     * Refresh access token.
     * Web: reads refresh_token from httpOnly cookie (no body needed).
     * Mobile: falls back to refresh token in request body for backward compatibility.
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse,
            @RequestBody(required = false) RefreshTokenRequest body) {

        // Prefer cookie (web), fall back to request body (mobile / native app)
        String refreshToken = extractRefreshCookie(httpRequest);
        if (refreshToken == null && body != null) {
            refreshToken = body.getRefreshToken();
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("No refresh token provided"));
        }

        try {
            AuthResponse response = authService.refreshToken(
                new RefreshTokenRequest(refreshToken));
            addRefreshCookie(httpResponse, response.getRefreshToken());
            return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
        } catch (Exception e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            clearRefreshCookie(httpResponse);
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid or expired refresh token"));
        }
    }

    /**
     * Logout — clears the httpOnly refresh cookie server-side.
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse httpResponse) {
        clearRefreshCookie(httpResponse);
        log.info("Logout — refresh cookie cleared");
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    // ── Cookie helpers ────────────────────────────────────────────────────────

    private void addRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
            .httpOnly(true)
            .secure(true)           // HTTPS only in prod; set false locally if needed
            .sameSite("Strict")
            .path("/api/auth")      // scoped: only sent on auth endpoints
            .maxAge(refreshExpiration / 1000)
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(0)
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if (REFRESH_COOKIE_NAME.equals(c.getName())) return c.getValue();
        }
        return null;
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
