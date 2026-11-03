package com.sindipro.api.reserva.dto;

import com.sindipro.api.reserva.Reserva;
import com.sindipro.api.reserva.StatusReserva;

import java.time.Instant;

public record ReservaResponse(
        Long id,
        Long areaComumId,
        String areaComumNome,
        Long unidadeId,
        String unidadeNumero,
        String blocoNome,
        Long solicitanteId,
        String solicitanteNome,
        Instant inicio,
        Instant fim,
        StatusReserva status,
        String observacao,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static ReservaResponse from(Reserva r) {
        return new ReservaResponse(
                r.getId(),
                r.getAreaComum().getId(),
                r.getAreaComum().getNome(),
                r.getUnidade().getId(),
                r.getUnidade().getNumero(),
                r.getUnidade().getBloco() != null ? r.getUnidade().getBloco().getNome() : null,
                r.getSolicitante().getId(),
                r.getSolicitante().getNome(),
                r.getInicio(),
                r.getFim(),
                r.getStatus(),
                r.getObservacao(),
                r.getCriadoEm(),
                r.getAtualizadoEm()
        );
    }
}