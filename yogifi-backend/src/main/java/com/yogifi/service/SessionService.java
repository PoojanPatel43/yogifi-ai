package com.yogifi.service;

import com.yogifi.dto.SessionEndRequest;
import com.yogifi.dto.SessionResponse;
import com.yogifi.dto.SessionStartRequest;
import com.yogifi.exception.PoseNotFoundException;
import com.yogifi.exception.SessionNotFoundException;
import com.yogifi.model.*;
import com.yogifi.repository.PoseRepository;
import com.yogifi.repository.SessionMetricsRepository;
import com.yogifi.repository.SessionRepository;
import com.yogifi.repository.PoseMistakeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMetricsRepository metricsRepository;
    private final PoseMistakeRepository mistakeRepository;
    private final PoseRepository poseRepository;
    private final UserService userService;

    @Transactional
    public SessionResponse startSession(SessionStartRequest request) {
        User user = userService.getCurrentUser();

        Pose pose = poseRepository.findById(request.getPoseId())
            .orElseThrow(() -> new PoseNotFoundException("Pose not found with id: " + request.getPoseId()));

        Session session = Session.builder()
            .user(user)
            .pose(pose)
            .status(Session.SessionStatus.IN_PROGRESS)
            .build();

        session = sessionRepository.save(session);
        log.info("Session started: {} for user: {}", session.getId(), user.getEmail());

        return SessionResponse.fromEntity(session);
    }

    @Transactional
    public SessionResponse endSession(SessionEndRequest request) {
        Session session = sessionRepository.findByIdWithPose(request.getSessionId())
            .orElseThrow(() -> new SessionNotFoundException("Session not found with id: " + request.getSessionId()));

        // Verify session belongs to current user
        User currentUser = userService.getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new SessionNotFoundException("Session not found");
        }

        // Update session
        session.setDurationSeconds(request.getDurationSeconds());
        session.setOverallScore(request.getOverallScore());
        session.setStabilityScore(request.getStabilityScore());
        session.setAlignmentScore(request.getAlignmentScore());
        session.setFeedback(request.getFeedback());
        session.setStatus(Session.SessionStatus.COMPLETED);
        session.setEndedAt(LocalDateTime.now());

        // Reference for lambda
        final Session sessionRef = session;

        // Save metrics if provided
        if (request.getMetrics() != null && !request.getMetrics().isEmpty()) {
            List<SessionMetrics> metrics = request.getMetrics().stream()
                .map(dto -> SessionMetrics.builder()
                    .session(sessionRef)
                    .metricType(dto.getMetricType())
                    .metricValue(dto.getMetricValue())
                    .expectedValue(dto.getExpectedValue())
                    .deviation(dto.getExpectedValue() != null && dto.getMetricValue() != null
                        ? Math.abs(dto.getMetricValue() - dto.getExpectedValue()) : null)
                    .timestampSeconds(dto.getTimestampSeconds())
                    .jointName(dto.getJointName())
                    .build())
                .collect(Collectors.toList());
            session.getMetrics().addAll(metrics);
        }

        // Save mistakes if provided
        if (request.getMistakes() != null && !request.getMistakes().isEmpty()) {
            List<PoseMistake> mistakes = request.getMistakes().stream()
                .map(dto -> PoseMistake.builder()
                    .session(sessionRef)
                    .joint(dto.getJoint())
                    .mistakeType(dto.getMistakeType())
                    .description(dto.getDescription())
                    .correction(dto.getCorrection())
                    .severity(PoseMistake.Severity.valueOf(dto.getSeverity()))
                    .occurrenceTimeSeconds(dto.getOccurrenceTimeSeconds())
                    .durationSeconds(dto.getDurationSeconds())
                    .build())
                .collect(Collectors.toList());
            session.getMistakes().addAll(mistakes);
        }

        session = sessionRepository.save(session);
        log.info("Session ended: {} with score: {}", session.getId(), session.getOverallScore());

        return SessionResponse.fromEntity(session, true);
    }

    public List<SessionResponse> getSessionHistory(int limit, int offset) {
        User user = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(offset / limit, limit);

        Page<Session> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        return sessions.getContent().stream()
            .map(SessionResponse::fromEntity)
            .collect(Collectors.toList());
    }

    public SessionResponse getSessionById(UUID sessionId) {
        Session session = sessionRepository.findByIdWithDetails(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found with id: " + sessionId));

        // Verify session belongs to current user
        User currentUser = userService.getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new SessionNotFoundException("Session not found");
        }

        return SessionResponse.fromEntity(session, true);
    }

    @Transactional
    public void cancelSession(UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new SessionNotFoundException("Session not found with id: " + sessionId));

        // Verify session belongs to current user
        User currentUser = userService.getCurrentUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new SessionNotFoundException("Session not found");
        }

        session.setStatus(Session.SessionStatus.CANCELLED);
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);

        log.info("Session cancelled: {}", sessionId);
    }
}
