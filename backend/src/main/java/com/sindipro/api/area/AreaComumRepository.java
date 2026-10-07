package com.sindipro.api.area;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AreaComumRepository extends JpaRepository<AreaComum, Long> {
    List<AreaComum> findByCondominioIdAndAtivoTrue(Long condominioId);
}