package hello.chatting.controller;

import hello.chatting.user.dto.UserDto;
import hello.chatting.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ViewController {

    private final UserService userService;

    @GetMapping("/")
    public String main() {return "main API endpoint";}

    @GetMapping("/api/chatting-status")
    public String chatting() {
        return "chatting service is active";
    }

    @GetMapping("/api/users")
    public List<UserDto> userList() throws Exception {
        return userService.findAll().stream()
                .map(UserDto::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/api/login-status")
    public String login() {
        return "login service is active";
    }

    @GetMapping("/.well-known/appspecific/com.chrome.devtools.json")
    public ResponseEntity<String> chromeDevTools() {
        return ResponseEntity.ok().body(""); // Return an empty 200 OK response
    }

}
