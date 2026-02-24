package com.yogifi.dto;

import com.yogifi.model.Pose;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoseResponse {

    private String id;
    private String name;
    private String sanskritName;
    private String difficulty;
    private String description;
    private String instructions;
    private String benefits;
    private String precautions;
    private String imageUrl;
    private Integer targetDurationSeconds;
    private String mlModelKey;

    public static PoseResponse fromEntity(Pose pose) {
        return PoseResponse.builder()
            .id(pose.getId().toString())
            .name(pose.getName())
            .sanskritName(pose.getSanskritName())
            .difficulty(pose.getDifficulty().name())
            .description(pose.getDescription())
            .instructions(pose.getInstructions())
            .benefits(pose.getBenefits())
            .precautions(pose.getPrecautions())
            .imageUrl(pose.getImageUrl())
            .targetDurationSeconds(pose.getTargetDurationSeconds())
            .mlModelKey(pose.getMlModelKey())
            .build();
    }
}
