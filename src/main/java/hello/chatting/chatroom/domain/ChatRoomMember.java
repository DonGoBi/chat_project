package hello.chatting.chatroom.domain;

import hello.chatting.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_room_member")
@Builder(toBuilder = true)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;         // ChatRoom.id FK

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column
    @Builder.Default
    private Boolean active = true;

    private LocalDateTime activeAt;

    @Column(length = 20)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Role role = Role.MEMBER;

    @Column(insertable = false, updatable = false)
    private LocalDateTime joinedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", insertable = false, updatable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "login_id", insertable = false, updatable = false)
    private User user;

}
