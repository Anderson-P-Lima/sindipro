package com.sindipro.api.financeiro.dto;

import com.sindipro.api.shared.dto.PageResponse;
import java.math.BigDecimal;

public record LancamentoPageResponse(
        PageResponse<LancamentoResponse> page,
        ResumoFinanceiro resumo
) {
    public record ResumoFinanceiro(
            BigDecimal totalReceitas,
            BigDecimal totalDespesas,
            BigDecimal totalEmAberto
    ) {}
}