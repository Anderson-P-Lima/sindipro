package com.sindipro.api.financeiro.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public record RegistrarPagamentoRequest(
        @NotNull @PastOrPresent LocalDate dataPagamento
) {}