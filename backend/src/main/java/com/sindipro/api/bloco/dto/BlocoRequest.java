package com.sindipro.api.bloco.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BlocoRequest(
        @NotBlank @Size(max = 50) String nome
) {}