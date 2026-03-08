package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "pose_mistakes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoseMistake {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(nullable = false)
    private String joint; // e.g., "left_knee", "right_elbow", "spine"

    @Column(name = "mistake_type", nullable = false)
    private String mistakeType; // e.g., "bent_too_much", "not_aligned", "overextended"

    @Column(columnDefinition = "TEXT")
    private String description; // Human-readable description

    @Column(columnDefinition = "TEXT")
    private String correction; // Suggested correction

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(name = "occurrence_time_seconds")
    private Double occurrenceTimeSeconds; // seconds from session start

    @Column(name = "duration_seconds")
    private Double durationSeconds; // how long the mistake persisted

    @Column(name = "current_angle")
    private Double currentAngle; // measured joint angle in degrees

    @Column(name = "target_angle")
    private Double targetAngle; // target joint angle for correct pose

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
