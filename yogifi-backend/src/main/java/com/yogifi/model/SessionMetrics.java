package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "session_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(name = "metric_type", nullable = false)
    private String metricType; // e.g., "knee_angle", "hip_angle", "shoulder_alignment"

    @Column(name = "metric_value", nullable = false)
    private Double metricValue;

    @Column(name = "expected_value")
    private Double expectedValue;

    @Column(name = "deviation")
    private Double deviation; // difference from expected

    @Column(name = "timestamp_seconds")
    private Double timestampSeconds; // relative to session start

    @Column(name = "joint_name")
    private String jointName; // which joint this metric relates to
}
