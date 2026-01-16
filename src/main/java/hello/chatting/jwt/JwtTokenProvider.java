package hello.chatting.jwt;

import hello.chatting.user.domain.CustomOAuth2User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider implements InitializingBean {

	private final String secret;
	private final long tokenValidityInMilliseconds;
	private SecretKey key;

	public JwtTokenProvider(
		@Value("${jwt.secret}") String secret,
		@Value("${jwt.expiration_ms}") long tokenValidityInMilliseconds) {
		this.secret = secret;
		this.tokenValidityInMilliseconds = tokenValidityInMilliseconds;
	}

	@Override
	public void afterPropertiesSet() {
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		this.key = Keys.hmacShaKeyFor(keyBytes);
	}

	    public String generateToken(Authentication authentication) {
	        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
	
	        Date now = new Date();
	        Date validity = new Date(now.getTime() + this.tokenValidityInMilliseconds);
	
	        Claims claims = Jwts.claims()
	            .setSubject(customOAuth2User.getName())
	            .setIssuedAt(now)
	            .setExpiration(validity)
	            .build();
	        // Add custom claims if needed, e.g., roles
	        // claims.put("roles", customOAuth2User.getAuthorities().stream()
	        //        .map(GrantedAuthority::getAuthority)
	        //        .collect(Collectors.joining(",")));
	
	        return Jwts.builder()
	            .setClaims(claims)
	            .signWith(key)
	            .compact();
	    }
	
	    public boolean validateToken(String token) {
	        try {
	            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
	            return true;
	        } catch (Exception e) {
	            log.error("Invalid JWT token: {}", e.getMessage());
	            return false;
	        }
	    }
	
	    public String getPayload(String token) {
	        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
	    }
	}
