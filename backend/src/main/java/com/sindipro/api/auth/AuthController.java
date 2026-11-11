package com.sindipro.api.auth;

import java.time.Instant;

import com.sindipro.api.auth.dto.AuthResponse;
import com.sindipro.api.auth.dto.LoginRequest;
import com.sindipro.api.auth.dto.RegisterRequest;
import com.sindipro.api.security.SecurityUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Login, registro e dados do usuário logado")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Registra novo usuário")
    public ResponseEntity<AuthResponse> registrar(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(201).body(authService.registrar(req));
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica usuário e retorna JWT")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Retorna dados do usuário autenticado")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal SecurityUser user) {
        var u = user.getUsuario();
        return ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "nome", u.getNome(),
                "email", u.getEmail(),
                "role", u.getRole().name()
        ));
    }
}