package com.sindipro.api.reserva;

import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ReservaRepository extends
        JpaRepository<Reserva, Long>,
        JpaSpecificationExecutor<Reserva> {

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

    // [PREVIOUS] List<Reserva> findBySolicitanteIdOrderByInicioDesc(Long usuarioId);

    long countByStatus(StatusReserva status);
    long countByStatusAndSolicitanteId(StatusReserva status, Long solicitanteId);

    @Query("""
    SELECT r FROM Reserva r
    WHERE r.inicio >= :agora
      AND r.status = 'APROVADA'
    ORDER BY r.inicio ASC
""")
    List<Reserva> findProximasAprovadas(@Param("agora") Instant agora, Pageable pageable);

    @Query("""
    SELECT r FROM Reserva r
    WHERE r.inicio >= :agora
      AND r.status = 'APROVADA'
      AND r.solicitante.id = :solicitanteId
    ORDER BY r.inicio ASC
""")
    List<Reserva> findProximasAprovadasBySolicitante(
            @Param("agora") Instant agora,
            @Param("solicitanteId") Long solicitanteId,
            Pageable pageable);
}
