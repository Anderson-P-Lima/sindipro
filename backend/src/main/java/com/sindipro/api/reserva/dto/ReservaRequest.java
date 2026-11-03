package com.sindipro.api.reserva.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record ReservaRequest(
        @NotNull Long areaComumId,
        @NotNull Long unidadeId,
        @NotNull Instant inicio,
        @NotNull Instant fim,
        @Size(max = 500) String observacao
) {}