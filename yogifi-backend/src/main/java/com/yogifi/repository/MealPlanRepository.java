package com.yogifi.repository;

import com.yogifi.model.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, UUID> {
    List<MealPlan> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
