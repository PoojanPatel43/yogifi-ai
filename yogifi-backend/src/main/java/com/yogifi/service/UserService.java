package com.yogifi.service;

import com.yogifi.dto.ProfileResponse;
import com.yogifi.dto.ProfileUpdateRequest;
import com.yogifi.dto.UserStatsResponse;
import com.yogifi.exception.UserNotFoundException;
import com.yogifi.model.User;
import com.yogifi.model.UserProfile;
import com.yogifi.repository.SessionRepository;
import com.yogifi.repository.UserProfileRepository;
import com.yogifi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SessionRepository sessionRepository;

    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmailWithProfile(email)
            .orElseThrow(() -> new UserNotFoundException("Current user not found"));
    }

    public ProfileResponse getProfile() {
        User user = getCurrentUser();
        return ProfileResponse.fromUser(user);
    }

    public ProfileResponse getProfileById(UUID userId) {
        User user = userRepository.findByIdWithProfile(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found with id: " + userId));
        return ProfileResponse.fromUser(user);
    }

    @Transactional
    public ProfileResponse updateProfile(ProfileUpdateRequest request) {
        User user = getCurrentUser();

        // Update user name if provided
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        // Get or create profile
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = UserProfile.builder()
                .user(user)
                .build();
            user.setProfile(profile);
        }

        // Update profile fields
        if (request.getAge() != null) {
            profile.setAge(request.getAge());
        }
        if (request.getHeight() != null) {
            profile.setHeight(request.getHeight());
        }
        if (request.getWeight() != null) {
            profile.setWeight(request.getWeight());
        }
        if (request.getFitnessLevel() != null) {
            profile.setFitnessLevel(request.getFitnessLevel());
        }
        if (request.getGoals() != null) {
            profile.setGoals(request.getGoals());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());

        return ProfileResponse.fromUser(user);
    }

    public UserStatsResponse getStats() {
        User user = getCurrentUser();
        UUID userId = user.getId();

        Long totalSessions = sessionRepository.countCompletedSessionsByUserId(userId);
        Long totalSeconds = sessionRepository.sumDurationByUserId(userId);
        Double avgScore = sessionRepository.avgScoreByUserId(userId);

        // Calculate streaks from completed session dates
        List<LocalDate> sessionDates = sessionRepository.findCompletedSessionDatesByUserId(userId);
        int currentStreak = 0;
        int longestStreak = 0;

        if (!sessionDates.isEmpty()) {
            // sessionDates is sorted DESC — calculate current streak from today
            LocalDate today = LocalDate.now();
            LocalDate checkDate = today;

            // Current streak: count consecutive days backward from today (or yesterday)
            if (!sessionDates.isEmpty()) {
                LocalDate firstDate = sessionDates.get(0);
                // Allow today or yesterday as the start
                if (firstDate.equals(today) || firstDate.equals(today.minusDays(1))) {
                    checkDate = firstDate;
                    currentStreak = 1;
                    for (int i = 1; i < sessionDates.size(); i++) {
                        if (sessionDates.get(i).equals(checkDate.minusDays(1))) {
                            currentStreak++;
                            checkDate = sessionDates.get(i);
                        } else if (!sessionDates.get(i).equals(checkDate)) {
                            break;
                        }
                    }
                }
            }

            // Longest streak: find max consecutive day run
            int streak = 1;
            longestStreak = 1;
            for (int i = 1; i < sessionDates.size(); i++) {
                if (sessionDates.get(i).equals(sessionDates.get(i - 1).minusDays(1))) {
                    streak++;
                    longestStreak = Math.max(longestStreak, streak);
                } else if (!sessionDates.get(i).equals(sessionDates.get(i - 1))) {
                    streak = 1;
                }
            }
        }

        // Count unique poses
        Integer posesCompleted = sessionRepository.countDistinctPosesByUserId(userId);

        // Most practiced pose
        List<Object[]> mostPracticed = sessionRepository.findMostPracticedPoseByUserId(userId);
        String mostPracticedPose = (!mostPracticed.isEmpty()) ? (String) mostPracticed.get(0)[0] : null;

        return UserStatsResponse.builder()
            .totalSessions(totalSessions)
            .totalMinutes(totalSeconds / 60)
            .averageScore(Math.round(avgScore * 10.0) / 10.0)
            .currentStreak(currentStreak)
            .longestStreak(longestStreak)
            .mostPracticedPose(mostPracticedPose)
            .posesCompleted(posesCompleted != null ? posesCompleted : 0)
            .build();
    }
}
