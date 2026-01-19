package hello.chatting.chat.service;

import hello.chatting.chat.domain.ChatMessage;
import hello.chatting.chat.dto.ChatMessageDto;
import hello.chatting.chat.repository.ChatRepository;
import hello.chatting.chatroom.domain.ChatRoom;
import hello.chatting.chatroom.domain.ChatRoomMember;
import hello.chatting.chatroom.domain.RoomType;
import hello.chatting.chatroom.repository.ChatRoomMemberRepository;
import hello.chatting.chatroom.repository.ChatRoomRepository;
import hello.chatting.user.domain.User;
import hello.chatting.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.expression.ExpressionException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    @Value("${file.upload.path}")
    private String uploadDir;

    private final ChatRepository chatRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public void save(ChatMessage chatMessage) throws Exception {

        // roomId에 대해서 ROOMTYPE에 조회해서 ROOMTYPE이 PRIVATE가 맞다면 그 떄 조회
        Long roomId = chatMessage.getRoomId();
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new Exception("채팅방을 찾을 수 없습니다."));

        if (room.getType() == RoomType.PRIVATE){

            // 1:1 방 멤버 조회
            List<ChatRoomMember> members = chatRoomMemberRepository.findByRoomId(roomId);

            for (ChatRoomMember member : members) {
                if (!member.getActive()) {
                    member.setActive(true);
                    chatRoomMemberRepository.save(member);
                }
            }

        }

        if (StringUtils.hasText(chatMessage.getMessage())) {
            chatRepository.save(chatMessage);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessageByUserId(ChatMessageDto dto) {
        List<ChatMessage> messages = chatRepository.findMessagesAfterLeave(dto.getRoomId(), dto.getSender());

        return messages.stream()
                .map(chatMessage -> {
                    String senderName = userRepository.findByLoginId(chatMessage.getSender())
                            .map(User::getName)
                            .orElse(chatMessage.getSender());

                    return ChatMessageDto.toDto(chatMessage)
                            .toBuilder()
                            .senderName(senderName)
                            .build();

                })
                .collect(Collectors.toList());
    }


    /**
     * 채팅용 파일 업로드
     */
    @Transactional
    public ChatMessage chatFileUpload(MultipartFile file, Long roomId, String sender) throws Exception {
        if (file.isEmpty()) {
            throw new Exception("파일이 없습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String saveFilename = UUID.randomUUID() + extension;

        Path baseDir = Paths.get(uploadDir);
        if (!Files.exists(baseDir)) {
            Files.createDirectories(baseDir);
        }

        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Path uploadDir = baseDir.resolve(today);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        Path filePath = uploadDir.resolve(saveFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // 클라이언트 접근용 URL 생성 WebMvcConfigurer에서 /files/** → uploadPath 매핑 필요
        String fileUrl = "/files/" + today + "/" + saveFilename;

        ChatMessage chatMessage = ChatMessage.builder()
                .roomId(roomId)
                .sender(sender)
                .type("FILE")
                .fileUrl(fileUrl)
                .fileName(originalFilename)
                .fileType(file.getContentType())
                .build();

        chatRepository.save(chatMessage);

        return chatMessage;
    }

    @Transactional(readOnly = true)
    public List<String> getRoomMembers(Long roomId) {
        return chatRoomMemberRepository.findByRoomId(roomId).stream()
                .map(ChatRoomMember::getUserId)
                .collect(Collectors.toList());
    }
}
