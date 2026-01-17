package com.yogifi.repository;

import com.yogifi.model.Pose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PoseRepository extends JpaRepository<Pose, UUID> {

    List<Pose> findByDifficulty(Pose.Difficulty difficulty);

    Optional<Pose> findByName(String name);

    List<Pose> findAllByOrderByDifficultyAscNameAsc();
}
