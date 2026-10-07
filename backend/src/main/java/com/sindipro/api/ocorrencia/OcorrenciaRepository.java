package com.sindipro.api.ocorrencia;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, Long> {
    List<Ocorrencia> findByAutorIdOrderByCriadoEmDesc(Long autorId);
    List<Ocorrencia> findByStatusOrderByPrioridadeDesc(StatusOcorrencia status);
    long countByStatus(StatusOcorrencia status);
}