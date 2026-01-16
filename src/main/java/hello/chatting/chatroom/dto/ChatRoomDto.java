package hello.chatting.chatroom.dto;

import com.fasterxml.jackson.annotation.JsonFormat; // Import 추가
import hello.chatting.chatroom.domain.ChatRoom;
import hello.chatting.chatroom.domain.RoomType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

@Slf4j
@Builder(toBuilder = true)
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDto {
    private Long id;             // BIGINT PK
    private RoomType type;         // PRIVATE / GROUP
    private String roomName;     // 그룹방 이름, 1:1은 null

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;

    // Entity → DTO 변환 (화면)
    public static ChatRoomDto toDto(ChatRoom chatRoom) {
        return ChatRoomDto.builder()
                .id(chatRoom.getId())
                .type(chatRoom.getType())
                .roomName(chatRoom.getRoomName())
                .createdAt(chatRoom.getCreatedAt())
                .build();
    }



    // DTO → Entity 변환
    public static ChatRoom toEntity(ChatRoomDto chatRoom) {
        return ChatRoom.builder()
                .id(chatRoom.getId())
                .type(chatRoom.getType())
                .roomName(chatRoom.getRoomName())
                .createdAt(chatRoom.getCreatedAt())
                .build();
    }
}
