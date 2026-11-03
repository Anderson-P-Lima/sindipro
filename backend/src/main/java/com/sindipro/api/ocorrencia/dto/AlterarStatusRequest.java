package com.sindipro.api.ocorrencia.dto;

import com.sindipro.api.ocorrencia.StatusOcorrencia;
import jakarta.validation.constraints.NotNull;

public record AlterarStatusRequest(
        @NotNull StatusOcorrencia status
) {}