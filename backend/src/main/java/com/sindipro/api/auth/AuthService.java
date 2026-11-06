package com.sindipro.api.auth;

import java.time.Instant;

import com.sindipro.api.auth.dto.AuthResponse;
import com.sindipro.api.auth.dto.LoginRequest;
import com.sindipro.api.auth.dto.RegisterRequest;
import com.sindipro.api.security.JwtService;
import com.sindipro.api.security.SecurityUser;
import com.sindipro.api.shared.exception.ResourceConflictException;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    @Transactional
    public AuthResponse registrar(RegisterRequest req) {
        if (usuarioRepository.existsByEmail(req.email())) {
            throw new ResourceConflictException("E-mail já cadastrado");
        }

        Usuario u = Usuario.builder()
                .nome(req.nome())
                .email(req.email())
                .senhaHash(passwordEncoder.encode(req.senha()))
                .role(req.role())
                .ativo(true)
                .build();

        usuarioRepository.save(u);
        return gerarResposta(u);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.senha()));

        SecurityUser su = (SecurityUser) auth.getPrincipal();
        Usuario u = su.getUsuario();
        u.setUltimoLogin(Instant.now());
        usuarioRepository.save(u);

        return gerarResposta(u);
    }

    private AuthResponse gerarResposta(Usuario u) {
        SecurityUser su = new SecurityUser(u);
        Map<String, Object> claims = Map.of(
                "role", u.getRole().name(),
                "nome", u.getNome(),
                "uid", u.getId()
        );
        String token = jwtService.gerarToken(su, claims);
        return new AuthResponse(token, u.getId(), u.getNome(), u.getEmail(), u.getRole().name());
    }
}