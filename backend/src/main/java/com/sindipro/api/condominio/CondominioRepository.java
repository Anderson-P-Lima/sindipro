package com.sindipro.api.condominio;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
public interface CondominioRepository extends JpaRepository<Condominio, Long> {}