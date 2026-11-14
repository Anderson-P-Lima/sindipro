package com.sindipro.api.dashboard.dto;

import java.math.BigDecimal;

public record GraficoEvolucaoDTO(
        String mes, // Ex: "Jun/26"
        BigDecimal receitas,
        BigDecimal despesas
) {}