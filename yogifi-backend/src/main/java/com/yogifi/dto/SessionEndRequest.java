package com.yogifi.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionEndRequest {

    @NotNull(message = "Session ID is required")
    private UUID sessionId;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 second")
    private Integer durationSeconds;

    @Min(value = 0, message = "Score must be between 0 and 100")
    @Max(value = 100, message = "Score must be between 0 and 100")
    private Double overallScore;

    @Min(value = 0, message = "Score must be between 0 and 100")
    @Max(value = 100, message = "Score must be between 0 and 100")
    private Double stabilityScore;

    @Min(value = 0, message = "Score must be between 0 and 100")
    @Max(value = 100, message = "Score must be between 0 and 100")
    private Double alignmentScore;

    private List<MetricDto> metrics;

    private List<MistakeDto> mistakes;

    private String feedback;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricDto {
        private String metricType;
        private Double metricValue;
        private Double expectedValue;
        private Double timestampSeconds;
        private String jointName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MistakeDto {
        private String joint;
        private String mistakeType;
        private String description;
        private String correction;
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL
        private Double occurrenceTimeSeconds;
        private Double durationSeconds;
    }
}
