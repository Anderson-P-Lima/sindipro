package com.sindipro.api.auth.dto;

import java.time.Instant;

import com.sindipro.api.usuario.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String nome,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, max = 100) String senha,
        @NotNull Role role
) {}