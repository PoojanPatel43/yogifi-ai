package com.yogifi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {

    private Long totalSessions;
    private Long totalMinutes;
    private Double averageScore;
    private Integer currentStreak; // days in a row
    private Integer longestStreak;
    private String mostPracticedPose;
    private Integer posesCompleted;
}
