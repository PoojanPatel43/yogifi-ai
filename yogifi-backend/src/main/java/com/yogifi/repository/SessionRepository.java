package com.yogifi.repository;

import com.yogifi.model.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Page<Session> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Session> findByUserIdAndStatus(UUID userId, Session.SessionStatus status);

    @Query("SELECT s FROM Session s LEFT JOIN FETCH s.pose WHERE s.id = :id")
    Optional<Session> findByIdWithPose(UUID id);

    @Query("SELECT s FROM Session s LEFT JOIN FETCH s.pose LEFT JOIN FETCH s.metrics LEFT JOIN FETCH s.mistakes WHERE s.id = :id")
    Optional<Session> findByIdWithDetails(UUID id);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Long countCompletedSessionsByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(s.durationSeconds), 0) FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Long sumDurationByUserId(UUID userId);

    @Query("SELECT COALESCE(AVG(s.overallScore), 0) FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Double avgScoreByUserId(UUID userId);

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.createdAt >= :startDate ORDER BY s.createdAt DESC")
    List<Session> findRecentSessionsByUserId(UUID userId, LocalDateTime startDate);

    @Query("SELECT DISTINCT CAST(s.createdAt AS LocalDate) FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED' ORDER BY CAST(s.createdAt AS LocalDate) DESC")
    List<java.time.LocalDate> findCompletedSessionDatesByUserId(UUID userId);

    @Query("SELECT COUNT(DISTINCT s.pose.id) FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED'")
    Integer countDistinctPosesByUserId(UUID userId);

    @Query("SELECT s.pose.name, COUNT(s) as cnt FROM Session s WHERE s.user.id = :userId AND s.status = 'COMPLETED' GROUP BY s.pose.name ORDER BY cnt DESC")
    List<Object[]> findMostPracticedPoseByUserId(UUID userId);
}
