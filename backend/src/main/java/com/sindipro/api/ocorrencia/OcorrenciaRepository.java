package com.sindipro.api.ocorrencia;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface OcorrenciaRepository extends
        JpaRepository<Ocorrencia, Long>,
        JpaSpecificationExecutor<Ocorrencia> {

    long countByStatus(StatusOcorrencia status);
    long countByResponsavelIdAndStatusIn(Long responsavelId, java.util.List<StatusOcorrencia> status);
}