package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "meal_days")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MealDay {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private MealPlan plan;

    private Integer dayNumber;

    @OneToMany(mappedBy = "mealDay", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("id ASC")
    private List<Meal> meals = new ArrayList<>();
}
