package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "poses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pose {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String sanskritName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(columnDefinition = "TEXT")
    private String precautions;

    private String imageUrl;

    @Column(name = "rules_version")
    @Builder.Default
    private Integer rulesVersion = 1;

    @Column(name = "target_duration_seconds")
    @Builder.Default
    private Integer targetDurationSeconds = 30;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum Difficulty {
        BEGINNER,
        INTERMEDIATE,
        ADVANCED
    }
}
