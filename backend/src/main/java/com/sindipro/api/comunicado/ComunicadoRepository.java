package com.sindipro.api.comunicado;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComunicadoRepository extends JpaRepository<Comunicado, Long> {

    Page<Comunicado> findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
            Long condominioId, Pageable pageable);

    Page<Comunicado> findByCondominioIdAndCategoriaOrderByFixadoDescPublicadoEmDesc(
            Long condominioId, CategoriaComunicado categoria, Pageable pageable);
}