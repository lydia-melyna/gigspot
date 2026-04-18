package com.gigspot.event.config;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.security.Key;
import java.util.Collections;

public class JwtAuthFilter extends OncePerRequestFilter {
    private static final String SECRET = "gigspotSecretKeyForJWTTokenGenerationLongEnough123456";
    private Key key() { return Keys.hmacShaKeyFor(SECRET.getBytes()); }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String username = Jwts.parserBuilder().setSigningKey(key()).build()
                    .parseClaimsJws(header.substring(7)).getBody().getSubject();
                SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList()));
            } catch (Exception ignored) {}
        }
        chain.doFilter(req, res);
    }
}
