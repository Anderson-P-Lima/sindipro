package com.sindipro.api.area.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalTime;

public record AreaComumRequest(
        @NotBlank @Size(max = 80) String nome,
        @Size(max = 255) String descricao,
        @Positive Integer capacidade,
        @NotNull LocalTime horarioIni,
        @NotNull LocalTime horarioFim,
        @NotNull @PositiveOrZero BigDecimal taxa
) {}