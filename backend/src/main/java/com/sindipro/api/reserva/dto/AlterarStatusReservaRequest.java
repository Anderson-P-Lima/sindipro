package com.sindipro.api.reserva.dto;

import com.sindipro.api.reserva.StatusReserva;
import jakarta.validation.constraints.NotNull;

public record AlterarStatusReservaRequest(
        @NotNull StatusReserva status
) {}