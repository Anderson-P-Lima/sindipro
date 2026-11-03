package com.sindipro.api.reserva;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("""
        SELECT r FROM Reserva r
        WHERE r.areaComum.id = :areaId
          AND r.status IN ('PENDENTE','APROVADA')
          AND r.inicio < :fim
          AND r.fim > :inicio
    """)

    List<Reserva> findConflitos(@Param("areaId") Long areaId,
                                @Param("inicio") Instant inicio,
                                @Param("fim") Instant fim);

    @Query("""
        SELECT COUNT(r) > 0 FROM Reserva r
        WHERE r.areaComum.id = :areaId
          AND r.status IN ('PENDENTE','APROVADA')
    """)
    boolean existsReservaAtivaPorArea(@Param("areaId") Long areaId);

    List<Reserva> findBySolicitanteIdOrderByInicioDesc(Long usuarioId);
}
