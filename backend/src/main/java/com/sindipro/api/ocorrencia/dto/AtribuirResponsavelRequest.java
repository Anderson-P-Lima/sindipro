package com.sindipro.api.ocorrencia.dto;

import jakarta.validation.constraints.NotNull;

public record AtribuirResponsavelRequest(
        @NotNull Long responsavelId
) {}