package com.gigspot.auth.service;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {
    private static final String SECRET = "gigspotSecretKeyForJWTTokenGenerationLongEnough123456";
    private static final long EXPIRATION = 86400000L;
    private Key key() { return Keys.hmacShaKeyFor(SECRET.getBytes()); }

    public String generateToken(String username, String role) {
        return Jwts.builder()
            .setClaims(Map.of("role", role))
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(key(), SignatureAlgorithm.HS256).compact();
    }
    public String extractUsername(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody().getSubject();
    }
    public boolean validateToken(String token) {
        try { Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token); return true; }
        catch (JwtException e) { return false; }
    }
}
