package com.sindipro.api.financeiro.dto;

import com.sindipro.api.financeiro.TipoLancamento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LancamentoRequest(
        @NotNull TipoLancamento tipo,
        @NotBlank @Size(max = 40) String categoria,
        @NotBlank @Size(max = 200) String descricao,
        @NotNull @Positive BigDecimal valor,
        @NotNull LocalDate dataVencimento,
        Long unidadeId          // opcional; null = lançamento geral do condomínio
) {}