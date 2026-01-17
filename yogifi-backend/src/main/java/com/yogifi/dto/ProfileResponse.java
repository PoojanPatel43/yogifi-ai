package com.yogifi.dto;

import com.yogifi.model.User;
import com.yogifi.model.UserProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private String id;
    private String email;
    private String name;
    private Integer age;
    private Double height;
    private Double weight;
    private String fitnessLevel;
    private String goals;
    private String avatarUrl;
    private String createdAt;

    public static ProfileResponse fromUser(User user) {
        ProfileResponse.ProfileResponseBuilder builder = ProfileResponse.builder()
            .id(user.getId().toString())
            .email(user.getEmail())
            .name(user.getName())
            .createdAt(user.getCreatedAt().toString());

        if (user.getProfile() != null) {
            UserProfile profile = user.getProfile();
            builder
                .age(profile.getAge())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .fitnessLevel(profile.getFitnessLevel() != null ? profile.getFitnessLevel().name() : null)
                .goals(profile.getGoals())
                .avatarUrl(profile.getAvatarUrl());
        }

        return builder.build();
    }
}
