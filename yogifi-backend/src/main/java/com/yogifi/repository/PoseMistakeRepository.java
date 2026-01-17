package com.yogifi.repository;

import com.yogifi.model.PoseMistake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PoseMistakeRepository extends JpaRepository<PoseMistake, UUID> {

    List<PoseMistake> findBySessionId(UUID sessionId);

    List<PoseMistake> findBySessionIdAndSeverity(UUID sessionId, PoseMistake.Severity severity);

    void deleteBySessionId(UUID sessionId);
}
