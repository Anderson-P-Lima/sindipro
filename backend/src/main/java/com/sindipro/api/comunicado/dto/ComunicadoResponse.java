package com.sindipro.api.comunicado.dto;

import com.sindipro.api.comunicado.CategoriaComunicado;
import com.sindipro.api.comunicado.Comunicado;

import java.time.Instant;

public record ComunicadoResponse(
        Long id,
        String titulo,
        String conteudo,
        CategoriaComunicado categoria,
        Boolean fixado,
        Long autorId,
        String autorNome,
        Instant publicadoEm,
        Instant atualizadoEm
) {
    public static ComunicadoResponse from(Comunicado c) {
        return new ComunicadoResponse(
                c.getId(), c.getTitulo(), c.getConteudo(), c.getCategoria(),
                c.getFixado(), c.getAutor().getId(), c.getAutor().getNome(),
                c.getPublicadoEm(), c.getAtualizadoEm()
        );
    }
}