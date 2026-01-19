package hello.chatting.chatroom.repository;

import hello.chatting.chatroom.domain.ChatRoom;
import hello.chatting.chatroom.domain.ChatRoomMember;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    List<ChatRoomMember> findByRoomIdAndActiveAndUserIdNot(Long roomId, boolean active, String userId);

    @Query(value = """
    SELECT 
        r.id,
        r.room_name,
        r.type,
        u.login_id,
        u.name,
        u.email,
        u.profile_image,
        rm.memberCount
    FROM chat_room r
    JOIN chat_room_member m ON r.id = m.room_id AND m.active = true
    JOIN user u ON m.user_id = u.login_id
    JOIN (
        SELECT room_id, COUNT(*) AS memberCount
        FROM chat_room_member
        WHERE active = true
        GROUP BY room_id
    ) AS rm ON rm.room_id = r.id
    WHERE r.id IN (
        SELECT room_id
        FROM chat_room_member
        WHERE active = true
        GROUP BY room_id
        HAVING COUNT(*) = :userCount
           AND SUM(user_id IN (:userIds)) = :userCount
    )
    GROUP BY r.id, r.room_name, r.type, u.login_id, u.name, u.email, u.profile_image
    """, nativeQuery = true)
    List<Object[]> findRoomAndUsersByExactMembers(
            @Param("userIds") List<String> userIds,
            @Param("userCount") long userCount
    );


    Optional<ChatRoomMember> findByRoomIdAndUserId(Long roomId, String userId);

    List<ChatRoomMember> findByRoomId(Long roomId);

    List<ChatRoomMember> findByRoomIdAndActive(Long roomId, boolean active);
}

