package hello.chatting.controller;

import hello.chatting.user.dto.UserDto;
import hello.chatting.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ViewController {

    private final UserService userService;

    @GetMapping("/")
    @ResponseBody
    public String main() {return "main API endpoint";}

    @GetMapping("/api/chatting-status")
    @ResponseBody
    public String chatting() {
        return "chatting service is active";
    }

    @GetMapping("/api/login-status")
    @ResponseBody
    public String login() {
        return "login service is active";
    }

    @GetMapping("/.well-known/appspecific/com.chrome.devtools.json")
    @ResponseBody
    public ResponseEntity<String> chromeDevTools() {
        return ResponseEntity.ok().body(""); // Return an empty 200 OK response
    }

    /**
     * React Router handle: Forward all non-api paths to index.html if integrated,
     * or handle specific routes like /login.
     */
    @GetMapping("/login")
    public String loginPage() {
        return "forward:/index.html";
    }

}
