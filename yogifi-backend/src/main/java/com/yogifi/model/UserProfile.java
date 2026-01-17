package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;

    @Column(name = "height_cm")
    private Double height; // in centimeters

    @Column(name = "weight_kg")
    private Double weight; // in kilograms

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FitnessLevel fitnessLevel = FitnessLevel.BEGINNER;

    @Column(columnDefinition = "TEXT")
    private String goals; // JSON stored as text

    private String avatarUrl;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum FitnessLevel {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED
    }
}
