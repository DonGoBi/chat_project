package hello.chatting.config;

import hello.chatting.user.domain.User;
import hello.chatting.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. 내 계정 (test)
        createDummyUser("test", "test", "JaeHyeong", "test@example.com", "/images/orgProfile.png");

        // 2. 친구 계정 1 (friend1)
        createDummyUser("friend1", "1234", "Alice", "friend1@example.com", "/images/kakao.png");

        // 3. 친구 계정 2 (friend2)
        createDummyUser("friend2", "1234", "Bob", "friend2@example.com", "/images/naver.png");
    }

    private void createDummyUser(String loginId, String rawPassword, String name, String email, String image) {
        Optional<User> existingUser = userRepository.findByLoginId(loginId);
        if (existingUser.isEmpty()) {
            User user = User.builder()
                    .loginId(loginId)
                    .password(passwordEncoder.encode(rawPassword))
                    .name(name)
                    .email(email)
                    .role("ROLE_USER")
                    .profileImage(image)
                    .build();
            userRepository.save(user);
            log.info("Created dummy user: {}", loginId);
        } else {
            log.info("Dummy user already exists: {}", loginId);
        }
    }
}
