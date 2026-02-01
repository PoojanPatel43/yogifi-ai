package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meal_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealPlan {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String dietaryPreference;
    private String goal;
    private Integer calorieTarget;
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String rawResponse;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("dayNumber ASC")
    private List<MealDay> mealDays = new ArrayList<>();

    @CreationTimestamp @Column(updatable = false)
    private LocalDateTime createdAt;
}
