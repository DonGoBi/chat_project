package hello.chatting.user.service;

import hello.chatting.user.domain.User;
import hello.chatting.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public List<User> findAll() throws Exception {
        List<User> userList = userRepository.findAll();
        if (userList.isEmpty() || userList == null) {
            throw new Exception("친구 목록 불러오기를 실패했습니다.");
        }
        return userList;
    }

    public User findByLoginId(String loginId) throws Exception {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new Exception("User not found with loginId: " + loginId));
    }

}
