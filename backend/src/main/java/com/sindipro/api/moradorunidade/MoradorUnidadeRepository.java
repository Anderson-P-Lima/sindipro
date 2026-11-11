package com.sindipro.api.moradorunidade;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MoradorUnidadeRepository extends JpaRepository<MoradorUnidade, Long> {
    List<MoradorUnidade> findByUsuarioId(Long usuarioId);
    List<MoradorUnidade> findByUnidadeId(Long unidadeId);

    @Query("""
        SELECT mu FROM MoradorUnidade mu
        JOIN FETCH mu.unidade u
        JOIN FETCH u.bloco
        WHERE mu.usuario.id = :usuarioId
    """)
    List<MoradorUnidade> findByUsuarioIdComUnidadeEBloco(@Param("usuarioId") Long usuarioId);
}