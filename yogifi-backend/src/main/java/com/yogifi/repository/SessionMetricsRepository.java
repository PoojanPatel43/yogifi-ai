package com.yogifi.repository;

import com.yogifi.model.SessionMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SessionMetricsRepository extends JpaRepository<SessionMetrics, UUID> {

    List<SessionMetrics> findBySessionId(UUID sessionId);

    List<SessionMetrics> findBySessionIdAndMetricType(UUID sessionId, String metricType);

    void deleteBySessionId(UUID sessionId);
}
