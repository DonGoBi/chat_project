package hello.chatting.chatroom.controller;

import hello.chatting.chatroom.domain.ChatRoom;
import hello.chatting.chatroom.domain.ChatRoomMember;
import hello.chatting.chatroom.dto.*;
import hello.chatting.chatroom.service.ChatRoomService;
import hello.chatting.user.domain.CustomOAuth2User;
import hello.chatting.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/chatRoom")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;
    private final UserService userService;

    @GetMapping("/list")
    public ResponseEntity<?> findAllByUserId(ChatRoomReqDto dto) throws Exception {
        List<ChatRoomDto> chatRoomDtoList = chatRoomService.findAllByUserId(dto.getUserId()).stream()
                .map(ChatRoomDto::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(chatRoomDtoList);
    }

    @PostMapping("/find")
    public ResponseEntity<?> findRoom(@Valid @RequestBody ChatRoomReqDto dto) throws Exception {
        ChatRoom privateRoom = chatRoomService.findPrivateRoom(dto);
        return  ResponseEntity.ok(ChatRoomDto.toDto(privateRoom));
    }

    @GetMapping("/findRoom")
    public ResponseEntity<?> getRoomInfo(ChatRoomReqDto dto) {
        List<ChatRoomMemberDto> userIdNot = chatRoomService.findByRoomIdAndUserIdNot(dto).stream()
                .map(ChatRoomMemberDto::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userIdNot);
    }

    @PostMapping("/userIds")
    public ResponseEntity<?> findRoomByUserIds(@RequestBody GroupChatRoomReqDto dto) {

        List<String> userIds = Optional.ofNullable(dto.getUserIds())
                .orElse(Collections.emptyList());

        List<RoomWithUsersDto> rooms = chatRoomService.findRoomByUserIds(userIds, dto.getUserId());

        return ResponseEntity.ok(rooms);
    }


    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@Valid @RequestBody GroupChatRoomReqDto dto) throws Exception {
        ChatRoom room = chatRoomService.createRoom(dto);
        return ResponseEntity.ok(ChatRoomDto.toDto(room));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteRoom(@RequestBody DeleteChatRoomReqDto dto) throws Exception {
        chatRoomService.deleteRoom(dto);
        return ResponseEntity.ok().build();
    }

}