package hello.chatting.chat.controller;

import hello.chatting.chat.domain.ChatMessage;
import hello.chatting.chat.dto.AlarmMessageDto;
import hello.chatting.chat.dto.ChatMessageDto;
import hello.chatting.chat.service.ChatService;
import hello.chatting.user.domain.CustomOAuth2User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ChatController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/alarm")
    public void sendAlarm(AlarmMessageDto alarmMessageDto) {
        messagingTemplate.convertAndSendToUser(alarmMessageDto.getReceiver(),
                "/queue/alarm",
                        alarmMessageDto);
    }

    @MessageMapping("chat/message")
    public void message(ChatMessageDto message) throws Exception {
        ChatMessage entity = ChatMessageDto.toEntity(message);
        chatService.save(entity);
        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }

    @MessageMapping("chat/typing")
    public void typing(ChatMessageDto message) {
        messagingTemplate.convertAndSend("/sub/chat/room/" + message.getRoomId(), message);
    }

    @GetMapping("/chat/rooms/{roomId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long roomId, @AuthenticationPrincipal CustomOAuth2User principal) {
        ChatMessageDto dto = ChatMessageDto.builder()
                .roomId(roomId)
                .sender(principal.getName())
                .build();
        List<ChatMessageDto> chatMessageDtoList = chatService.getMessageByUserId(dto);
        return ResponseEntity.ok(chatMessageDtoList);
    }

    @PostMapping("/chat/upload")
    public ResponseEntity<?> upload(@RequestParam("chatFile") MultipartFile chatFile,
                                    @RequestParam("roomId") Long roomId,
                                    @AuthenticationPrincipal CustomOAuth2User principal) throws Exception {
        ChatMessage chatMessage = chatService.chatFileUpload(chatFile, roomId, principal.getName());
        return ResponseEntity.ok(ChatMessageDto.toDto(chatMessage));
    }

}
