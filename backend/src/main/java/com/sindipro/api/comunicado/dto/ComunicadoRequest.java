package com.sindipro.api.comunicado.dto;

import com.sindipro.api.comunicado.CategoriaComunicado;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ComunicadoRequest(
        @NotBlank @Size(max = 150) String titulo,
        @NotBlank String conteudo,
        @NotNull CategoriaComunicado categoria,
        Boolean fixado
) {}