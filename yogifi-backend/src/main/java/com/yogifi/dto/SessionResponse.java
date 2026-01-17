package com.yogifi.dto;

import com.yogifi.model.PoseMistake;
import com.yogifi.model.Session;
import com.yogifi.model.SessionMetrics;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private String id;
    private String poseId;
    private String poseName;
    private Integer durationSeconds;
    private Double overallScore;
    private Double stabilityScore;
    private Double alignmentScore;
    private String status;
    private String createdAt;
    private String endedAt;
    private String feedback;
    private List<MetricDto> metrics;
    private List<MistakeDto> mistakes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricDto {
        private String id;
        private String metricType;
        private Double metricValue;
        private Double expectedValue;
        private Double deviation;
        private Double timestampSeconds;
        private String jointName;

        public static MetricDto fromEntity(SessionMetrics metric) {
            return MetricDto.builder()
                .id(metric.getId().toString())
                .metricType(metric.getMetricType())
                .metricValue(metric.getMetricValue())
                .expectedValue(metric.getExpectedValue())
                .deviation(metric.getDeviation())
                .timestampSeconds(metric.getTimestampSeconds())
                .jointName(metric.getJointName())
                .build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MistakeDto {
        private String id;
        private String joint;
        private String mistakeType;
        private String description;
        private String correction;
        private String severity;
        private Double occurrenceTimeSeconds;
        private Double durationSeconds;

        public static MistakeDto fromEntity(PoseMistake mistake) {
            return MistakeDto.builder()
                .id(mistake.getId().toString())
                .joint(mistake.getJoint())
                .mistakeType(mistake.getMistakeType())
                .description(mistake.getDescription())
                .correction(mistake.getCorrection())
                .severity(mistake.getSeverity().name())
                .occurrenceTimeSeconds(mistake.getOccurrenceTimeSeconds())
                .durationSeconds(mistake.getDurationSeconds())
                .build();
        }
    }

    public static SessionResponse fromEntity(Session session) {
        return fromEntity(session, false);
    }

    public static SessionResponse fromEntity(Session session, boolean includeDetails) {
        SessionResponseBuilder builder = SessionResponse.builder()
            .id(session.getId().toString())
            .poseId(session.getPose().getId().toString())
            .poseName(session.getPose().getName())
            .durationSeconds(session.getDurationSeconds())
            .overallScore(session.getOverallScore())
            .stabilityScore(session.getStabilityScore())
            .alignmentScore(session.getAlignmentScore())
            .status(session.getStatus().name())
            .createdAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : null)
            .endedAt(session.getEndedAt() != null ? session.getEndedAt().toString() : null)
            .feedback(session.getFeedback());

        if (includeDetails) {
            builder.metrics(session.getMetrics().stream()
                .map(MetricDto::fromEntity)
                .collect(Collectors.toList()));

            builder.mistakes(session.getMistakes().stream()
                .map(MistakeDto::fromEntity)
                .collect(Collectors.toList()));
        }

        return builder.build();
    }
}
