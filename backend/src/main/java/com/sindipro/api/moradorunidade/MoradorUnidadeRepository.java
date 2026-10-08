package com.sindipro.api.moradorunidade;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MoradorUnidadeRepository extends JpaRepository<MoradorUnidade, Long> {
    List<MoradorUnidade> findByUsuarioId(Long usuarioId);
    List<MoradorUnidade> findByUnidadeId(Long unidadeId);
}