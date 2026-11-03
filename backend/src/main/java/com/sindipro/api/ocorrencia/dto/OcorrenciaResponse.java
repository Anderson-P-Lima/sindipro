package com.sindipro.api.ocorrencia.dto;

import com.sindipro.api.ocorrencia.Ocorrencia;
import com.sindipro.api.ocorrencia.PrioridadeOcorrencia;
import com.sindipro.api.ocorrencia.StatusOcorrencia;

import java.time.Instant;

public record OcorrenciaResponse(
        Long id,
        String titulo,
        String descricao,
        PrioridadeOcorrencia prioridade,
        StatusOcorrencia status,
        Long unidadeId,
        String unidadeNumero,
        String blocoNome,
        Long autorId,
        String autorNome,
        Long responsavelId,
        String responsavelNome,
        Instant criadoEm,
        Instant atualizadoEm,
        Instant resolvidoEm
) {
    public static OcorrenciaResponse from(Ocorrencia o) {
        Long unidadeId = o.getUnidade() != null ? o.getUnidade().getId() : null;
        String unidadeNumero = o.getUnidade() != null ? o.getUnidade().getNumero() : null;
        String blocoNome = (o.getUnidade() != null && o.getUnidade().getBloco() != null)
                ? o.getUnidade().getBloco().getNome() : null;

        return new OcorrenciaResponse(
                o.getId(),
                o.getTitulo(),
                o.getDescricao(),
                o.getPrioridade(),
                o.getStatus(),
                unidadeId,
                unidadeNumero,
                blocoNome,
                o.getAutor().getId(),
                o.getAutor().getNome(),
                o.getResponsavel() != null ? o.getResponsavel().getId() : null,
                o.getResponsavel() != null ? o.getResponsavel().getNome() : null,
                o.getCriadoEm(),
                o.getAtualizadoEm(),
                o.getResolvidoEm()
        );
    }
}