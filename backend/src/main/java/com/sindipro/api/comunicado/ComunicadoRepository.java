package com.sindipro.api.comunicado;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ComunicadoRepository extends JpaRepository<Comunicado, Long> {
    Page<Comunicado> findByCondominioIdOrderByPublicadoEmDesc(Long condominioId, Pageable pageable);
}