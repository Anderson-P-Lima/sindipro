package com.sindipro.api.unidade.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UnidadeRequest(
        @NotNull Long blocoId,
        @NotBlank @Size(max = 10) String numero,
        @Min(0) Integer andar
) {}