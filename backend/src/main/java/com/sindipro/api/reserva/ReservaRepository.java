package com.sindipro.api.reserva;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
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
                                @Param("inicio") OffsetDateTime inicio,
                                @Param("fim") OffsetDateTime fim);

    List<Reserva> findBySolicitanteIdOrderByInicioDesc(Long usuarioId);
}
