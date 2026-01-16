package hello.chatting.chatroom.repository;

import hello.chatting.chatroom.domain.ChatRoom;
import hello.chatting.chatroom.domain.ChatRoomMember;
import hello.chatting.chatroom.domain.RoomType;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("""
        SELECT r FROM ChatRoom r
            JOIN ChatRoomMember m1 ON r.id = m1.roomId
            JOIN ChatRoomMember m2 ON r.id = m2.roomId
        WHERE r.type = :type
          AND m1.userId = :me
          AND m2.userId = :friendId
          AND m1.id != m2.id
    """)
    ChatRoom findPrivateRoom(String me, String friendId, RoomType type);

    @Query("""
        SELECT cr FROM ChatRoom cr
            JOIN ChatRoomMember m ON cr.id = m.roomId
            LEFT JOIN ChatMessage cm ON cr.id = cm.roomId
        WHERE m.userId = :userId
            AND m.active = true
        GROUP BY cr.id
        ORDER BY GREATEST(coalesce(MAX(cm.createdAt),'1970-01-01'), cr.createdAt) DESC
    """)
    List<ChatRoom> findAllByUserId(String userId);


}

