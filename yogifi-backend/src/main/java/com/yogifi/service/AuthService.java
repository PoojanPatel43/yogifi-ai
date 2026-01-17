package com.yogifi.service;

import com.yogifi.dto.AuthResponse;
import com.yogifi.dto.LoginRequest;
import com.yogifi.dto.RefreshTokenRequest;
import com.yogifi.dto.RegisterRequest;
import com.yogifi.exception.InvalidCredentialsException;
import com.yogifi.exception.UserAlreadyExistsException;
import com.yogifi.model.User;
import com.yogifi.model.UserProfile;
import com.yogifi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with email " + request.getEmail() + " already exists");
        }

        // Create new user
        User user = User.builder()
            .email(request.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .name(request.getName().trim())
            .status(User.UserStatus.ACTIVE)
            .build();

        // Create default profile
        UserProfile profile = UserProfile.builder()
            .user(user)
            .fitnessLevel(UserProfile.FitnessLevel.BEGINNER)
            .build();

        user.setProfile(profile);

        // Save user (profile is cascaded)
        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        // Generate tokens
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    request.getEmail().toLowerCase().trim(),
                    request.getPassword()
                )
            );
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
            .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        log.info("User logged in: {}", user.getEmail());

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.validateToken(refreshToken)) {
            throw new InvalidCredentialsException("Invalid or expired refresh token");
        }

        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
            .token(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtService.getExpirationTime() / 1000) // Convert to seconds
            .user(AuthResponse.UserDto.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getProfile() != null ? user.getProfile().getAvatarUrl() : null)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build())
            .build();
    }
}
