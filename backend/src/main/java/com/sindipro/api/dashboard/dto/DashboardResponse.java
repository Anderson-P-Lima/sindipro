package com.sindipro.api.dashboard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record DashboardResponse(
        ComunicadosResumo comunicados,
        OcorrenciasResumo ocorrencias,
        ReservasResumo reservas,

        @JsonInclude(JsonInclude.Include.NON_NULL)
        FinanceiroResumo financeiro
) {

    public record ComunicadosResumo(long total) {}

    public record OcorrenciasResumo(
            long abertas,
            long emAndamento,
            long resolvidas,
            long canceladas,
            long total
    ) {}

    public record ReservasResumo(
            long pendentes,
            long aprovadas,
            List<ReservaResumo> proximas
    ) {}

    public record ReservaResumo(
            Long id,
            String areaComumNome,
            Instant inicio,
            Instant fim,
            String status
    ) {}

    public record FinanceiroResumo(
            MesAtual mesAtual,
            EmAberto emAberto
    ) {}

    public record MesAtual(
            BigDecimal receitasPagas,
            BigDecimal despesasPagas,
            BigDecimal saldo
    ) {}

    public record EmAberto(
            long quantidade,
            BigDecimal valor
    ) {}
}