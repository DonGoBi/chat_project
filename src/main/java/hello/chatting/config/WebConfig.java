package hello.chatting.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload.path}")
    private String uploadPath; // 예: ./uploads

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // OS 호환성을 위해 파일 URI 생성
        String resourceLocation = Paths.get(uploadPath).toAbsolutePath().toUri().toString();
        
        registry.addResourceHandler("/files/**")
                .addResourceLocations(resourceLocation);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 모든 경로에 대해
                .allowedOrigins("http://localhost:3000") // React 개발 서버 주소
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS") // 허용할 HTTP 메소드
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true); // 쿠키 인증 요청 허용
    }
}