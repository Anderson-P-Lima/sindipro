package com.sindipro.api.unidade.dto;

import com.sindipro.api.unidade.Unidade;
import java.time.Instant;

public record UnidadeResponse(
        Long id,
        Long blocoId,
        String blocoNome,
        String numero,
        Integer andar,
        Boolean ativo,
        Instant criadoEm
) {
    public static UnidadeResponse from(Unidade u) {
        return new UnidadeResponse(
                u.getId(), u.getBloco().getId(), u.getBloco().getNome(),
                u.getNumero(), u.getAndar(), u.getAtivo(), u.getCriadoEm()
        );
    }
}