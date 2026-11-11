package com.sindipro.api.bloco.dto;

import com.sindipro.api.bloco.Bloco;
import java.time.Instant;

public record BlocoResponse(
        Long id,
        String nome,
        Long condominioId,
        String condominioNome,
        Instant criadoEm
) {
    public static BlocoResponse from(Bloco b) {
        return new BlocoResponse(
                b.getId(), b.getNome(),
                b.getCondominio().getId(), b.getCondominio().getNome(),
                b.getCriadoEm()
        );
    }
}