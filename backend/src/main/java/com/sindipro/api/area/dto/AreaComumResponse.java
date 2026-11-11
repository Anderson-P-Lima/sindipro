package com.sindipro.api.area.dto;

import com.sindipro.api.area.AreaComum;

import java.math.BigDecimal;
import java.time.LocalTime;

public record AreaComumResponse(
        Long id,
        String nome,
        String descricao,
        Integer capacidade,
        LocalTime horarioIni,
        LocalTime horarioFim,
        BigDecimal taxa,
        Boolean ativo
) {
    public static AreaComumResponse from(AreaComum a) {
        return new AreaComumResponse(
                a.getId(), a.getNome(), a.getDescricao(), a.getCapacidade(),
                a.getHorarioIni(), a.getHorarioFim(), a.getTaxa(), a.getAtivo()
        );
    }
}