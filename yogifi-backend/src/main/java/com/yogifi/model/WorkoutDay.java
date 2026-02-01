package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workout_days")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutDay {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private FitnessPlan plan;

    private Integer dayNumber;
    private String focus;
    private String warmup;
    private String cooldown;

    @OneToMany(mappedBy = "workoutDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("id ASC")
    private List<Exercise> exercises = new ArrayList<>();
}
