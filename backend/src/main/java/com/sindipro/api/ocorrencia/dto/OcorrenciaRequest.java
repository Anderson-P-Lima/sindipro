package com.sindipro.api.ocorrencia.dto;

import com.sindipro.api.ocorrencia.PrioridadeOcorrencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OcorrenciaRequest(
        @NotBlank @Size(max = 150) String titulo,
        @NotBlank String descricao,
        PrioridadeOcorrencia prioridade,
        Long unidadeId
) {}