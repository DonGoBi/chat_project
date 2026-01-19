package hello.chatting.chatroom.dto;

import hello.chatting.chatroom.domain.RoomType;
import lombok.*;

@Builder(toBuilder = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class DeleteChatRoomReqDto {
    private Long roomId;
    private String userId;
    private RoomType type;
}
