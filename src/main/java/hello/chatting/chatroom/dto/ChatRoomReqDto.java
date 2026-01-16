package hello.chatting.chatroom.dto;

import hello.chatting.chatroom.domain.ChatRoom;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Builder(toBuilder = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomReqDto {

    @NotNull(message = "내 아이디")
    private String userId;

    private String friendId;

    private Long roomId;
}
