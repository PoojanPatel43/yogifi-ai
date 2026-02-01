package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "fitness_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FitnessPlan {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String goal;
    private String fitnessLevel;
    private Integer daysPerWeek;
    private String equipment;

    @Column(columnDefinition = "TEXT")
    private String rawResponse;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("dayNumber ASC")
    private List<WorkoutDay> workoutDays = new ArrayList<>();

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;
}
