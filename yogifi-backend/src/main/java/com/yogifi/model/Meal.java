package com.yogifi.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "meals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Meal {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_day_id", nullable = false)
    private MealDay mealDay;

    private String mealType;
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    private Integer calories;
    private Integer protein;
    private Integer carbs;
    private Integer fat;
}
