package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pose_id", nullable = false)
    private Pose pose;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "overall_score")
    private Double overallScore; // 0-100

    @Column(name = "stability_score")
    private Double stabilityScore; // 0-100

    @Column(name = "alignment_score")
    private Double alignmentScore; // 0-100

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SessionStatus status = SessionStatus.IN_PROGRESS;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime endedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SessionMetrics> metrics = new ArrayList<>();

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PoseMistake> mistakes = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String feedback; // JSON feedback summary

    public enum SessionStatus {
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }
}
