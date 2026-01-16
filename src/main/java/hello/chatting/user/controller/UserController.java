package hello.chatting.user.controller;

import hello.chatting.user.domain.CustomOAuth2User;
import hello.chatting.user.domain.User;
import hello.chatting.user.dto.UserDto;
import hello.chatting.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> userList() throws Exception {
        List<UserDto> userList = userService.findAll()
                .stream()
                .map(UserDto::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userList);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal CustomOAuth2User principal) throws Exception {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.findByLoginId(principal.getName());
        return ResponseEntity.ok(UserDto.toDto(user));
    }
}
