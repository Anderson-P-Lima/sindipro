package com.sindipro.api.bloco;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlocoRepository extends JpaRepository<Bloco, Long> {
    List<Bloco> findByCondominioId(Long condominioId);
}