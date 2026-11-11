package com.sindipro.api.auth.dto;

import java.time.Instant;

public record AuthResponse(
        String token,
        String tipo,
        Long id,
        String nome,
        String email,
        String role
) {
    public AuthResponse(String token, Long id, String nome, String email, String role) {
        this(token, "Bearer", id, nome, email, role);
    }
}
