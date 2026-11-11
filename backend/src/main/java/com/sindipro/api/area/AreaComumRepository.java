package com.sindipro.api.area;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AreaComumRepository extends JpaRepository<AreaComum, Long> {
    List<AreaComum> findByCondominioIdAndAtivoTrue(Long condominioId);
    List<AreaComum> findByCondominioId(Long condominioId);

    boolean existsByCondominioIdAndNomeIgnoreCaseAndAtivoTrue(
            Long condominioId, String nome);

    boolean existsByCondominioIdAndNomeIgnoreCase(Long condominioId, String nome);
}