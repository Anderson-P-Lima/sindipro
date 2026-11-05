package com.sindipro.api.financeiro.dto;

import com.sindipro.api.financeiro.LancamentoFinanceiro;
import com.sindipro.api.financeiro.StatusLancamento;
import com.sindipro.api.financeiro.TipoLancamento;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record LancamentoResponse(
        Long id,
        TipoLancamento tipo,
        String categoria,
        String descricao,
        BigDecimal valor,
        LocalDate dataVencimento,
        LocalDate dataPagamento,
        StatusLancamento status,
        Long unidadeId,
        String unidadeNumero,
        String blocoNome,
        Long criadoPorId,
        String criadoPorNome,
        Instant criadoEm,
        Instant atualizadoEm
) {
    public static LancamentoResponse from(LancamentoFinanceiro l) {
        return new LancamentoResponse(
                l.getId(),
                l.getTipo(),
                l.getCategoria(),
                l.getDescricao(),
                l.getValor(),
                l.getDataVencimento(),
                l.getDataPagamento(),
                l.getStatus(),
                l.getUnidade() != null ? l.getUnidade().getId() : null,
                l.getUnidade() != null ? l.getUnidade().getNumero() : null,
                (l.getUnidade() != null && l.getUnidade().getBloco() != null)
                        ? l.getUnidade().getBloco().getNome() : null,
                l.getCriadoPor().getId(),
                l.getCriadoPor().getNome(),
                l.getCriadoEm(),
                l.getAtualizadoEm()
        );
    }
}