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

    // API-focused whitelist
    private static final String[] WHITELIST = {
            "/",
            "/ws-stomp/**", // Allow WebSocket connections
            // "/api/**", // Allow all /api paths for now for easier development - Removed for JWT security
            "/oauth2/**",
            "/css/**",
            "/js/**",
            "/images/**",
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
                .cors(Customizer.withDefaults()) // Enable CORS with default settings
                .csrf(csrf -> csrf.disable()) // CSRF is already disabled
                // Make the session stateless
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(WHITELIST).permitAll() // 인증안해도 되는 url
                        .anyRequest().authenticated()
                )
                // Add JWT Filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // formLogin is removed, as we will use token-based auth
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .redirectionEndpoint(endpoint -> endpoint.baseUri("/oauth2/callback/*")) // OAuth2 콜백 URL 패턴 설정
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService)) // 사용자 정보를 가져올 때 커스텀 서비스 사용
                        .successHandler(oAuth2AuthenticationSuccessHandler) // JWT 발급 및 리다이렉트를 위한 커스텀 핸들러 사용
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login") // 로그아웃 성공 후 이동할 URL 지정
                        .invalidateHttpSession(true) // This will be revisited for stateless auth
                        .deleteCookies("JSESSIONID") // This will be revisited for stateless auth
                );

        return httpSecurity.build();
    }

    // BCrypt password encoder를 리턴하는 메서드
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
