package hello.chatting.user.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user")
@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "login_id")
    private String loginId;
    private String password;
    private String email;
    private String name;
    private String role;
    private String profileImage;
}
