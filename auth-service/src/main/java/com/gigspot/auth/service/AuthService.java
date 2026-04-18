package com.gigspot.auth.service;
import com.gigspot.auth.model.User;
import com.gigspot.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository repo;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;

    public Map<String, Object> register(String username, String email, String password) {
        Map<String, Object> r = new HashMap<>();
        if (repo.existsByUsername(username)) { r.put("success", false); r.put("message", "Pseudo déjà pris"); return r; }
        if (repo.existsByEmail(email)) { r.put("success", false); r.put("message", "Email déjà utilisé"); return r; }
        User u = new User(); u.setUsername(username); u.setEmail(email);
        u.setPassword(encoder.encode(password)); repo.save(u);
        r.put("success", true); r.put("token", jwtService.generateToken(username, "USER"));
        r.put("username", username); r.put("message", "Compte créé !"); return r;
    }

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> r = new HashMap<>();
        User u = repo.findByUsername(username).orElse(null);
        if (u == null || !encoder.matches(password, u.getPassword())) {
            r.put("success", false); r.put("message", "Identifiants incorrects"); return r;
        }
        r.put("success", true); r.put("token", jwtService.generateToken(username, u.getRole()));
        r.put("username", username); r.put("email", u.getEmail()); return r;
    }

    public Map<String, Object> validate(String token) {
        boolean valid = jwtService.validateToken(token);
        Map<String, Object> r = new HashMap<>();
        r.put("valid", valid);
        if (valid) r.put("username", jwtService.extractUsername(token));
        return r;
    }
}
