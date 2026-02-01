package com.yogifi.repository;

import com.yogifi.model.FitnessPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface FitnessPlanRepository extends JpaRepository<FitnessPlan, UUID> {
    List<FitnessPlan> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
