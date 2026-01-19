package hello.chatting.config;

import hello.chatting.jwt.JwtAuthenticationFilter;
import hello.chatting.jwt.OAuth2AuthenticationSuccessHandler;
import hello.chatting.user.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler; // 성공 핸들러 주입
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // API 중심의 화이트리스트
    private static final String[] WHITELIST = {
            "/",
            "/ws-stomp/**", // 웹소켓 연결 허용
            // "/api/**", // 개발 편의를 위해 모든 /api 경로 허용 (JWT 보안 적용으로 인해 주석 처리됨)
            "/oauth2/**",
            "/css/**",
            "/js/**",
            "/images/**",
            "/files/**", // 업로드된 파일 접근 허용
            "/login",
            "/oauth/**" // React로 리다이렉트될 경로 허용
    };

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        // 정적 리소스 등의 보안 필터 적용을 무시
        return (web) -> web.ignoring().requestMatchers("/.well-known/**");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {


        httpSecurity
                .cors(Customizer.withDefaults()) // 기본 설정으로 CORS 활성화
                .csrf(csrf -> csrf.disable()) // CSRF는 이미 비활성화됨
                // 세션을 상태 비저장(Stateless)으로 관리
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(WHITELIST).permitAll() // 인증 안 해도 되는 url
                        .anyRequest().authenticated()
                )
                // JWT 필터 추가
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // 폼 로그인은 제거됨 (토큰 기반 인증 사용)
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .redirectionEndpoint(endpoint -> endpoint.baseUri("/oauth2/callback/*")) // OAuth2 콜백 URL 패턴 설정
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService)) // 사용자 정보를 가져올 때 커스텀 서비스 사용
                        .successHandler(oAuth2AuthenticationSuccessHandler) // JWT 발급 및 리다이렉트를 위한 커스텀 핸들러 사용
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login") // 로그아웃 성공 후 이동할 URL 지정
                        .invalidateHttpSession(true) // 상태 비저장 인증에서는 다시 검토 필요
                        .deleteCookies("JSESSIONID") // 상태 비저장 인증에서는 다시 검토 필요
                );

        return httpSecurity.build();
    }

    // BCrypt password encoder를 리턴하는 메서드
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder(){
        return new BCryptPasswordEncoder();
    }
}