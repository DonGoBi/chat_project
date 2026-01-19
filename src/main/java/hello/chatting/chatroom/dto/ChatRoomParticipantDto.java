package hello.chatting.chatroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomParticipantDto {
    private String loginId;
    private String name;
    private String profileImage;
}
