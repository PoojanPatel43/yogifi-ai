package com.yogifi.repository;

import com.yogifi.model.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, UUID> {
    List<ChatConversation> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}
