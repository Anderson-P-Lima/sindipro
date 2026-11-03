package com.sindipro.api.reserva;

import com.sindipro.api.area.AreaComum;
import com.sindipro.api.area.AreaComumRepository;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.reserva.dto.AlterarStatusReservaRequest;
import com.sindipro.api.reserva.dto.ReservaRequest;
import com.sindipro.api.reserva.dto.ReservaResponse;
import com.sindipro.api.shared.dto.PageResponse;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.Unidade;
import com.sindipro.api.unidade.UnidadeRepository;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReservaService {

    /**
     * Fuso considerado para interpretar horários de negócio (horário de Brasília).
     * O front-end deve enviar datas com offset -03:00 para garantir consistência.
     */
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    private static final Map<StatusReserva, Set<StatusReserva>> TRANSICOES = Map.of(
            StatusReserva.PENDENTE,  Set.of(StatusReserva.APROVADA, StatusReserva.RECUSADA, StatusReserva.CANCELADA),
            StatusReserva.APROVADA,  Set.of(StatusReserva.CONCLUIDA, StatusReserva.CANCELADA),
            StatusReserva.RECUSADA,  Set.of(),
            StatusReserva.CANCELADA, Set.of(),
            StatusReserva.CONCLUIDA, Set.of()
    );

    private final ReservaRepository repository;
    private final AreaComumRepository areaRepository;
    private final UnidadeRepository unidadeRepository;
    private final MoradorUnidadeRepository moradorUnidadeRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReservaResponse> listar(
            Pageable pageable,
            StatusReserva status,
            Long areaComumId,
            Long unidadeId,
            Usuario solicitante) {

        Page<Reserva> page = repository.findAll((root, query, cb) -> {
            var ps = new ArrayList<Predicate>();
            if (status != null)       ps.add(cb.equal(root.get("status"), status));
            if (areaComumId != null)  ps.add(cb.equal(root.get("areaComum").get("id"), areaComumId));
            if (unidadeId != null)    ps.add(cb.equal(root.get("unidade").get("id"), unidadeId));

            if (solicitante.getRole() == Role.MORADOR) {
                ps.add(cb.equal(root.get("solicitante").get("id"), solicitante.getId()));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        }, pageable);

        return PageResponse.from(page, ReservaResponse::from);
    }

    @Transactional(readOnly = true)
    public ReservaResponse buscar(Long id, Usuario solicitante) {
        Reserva r = obter(id);
        validarVisibilidade(r, solicitante);
        return ReservaResponse.from(r);
    }

    @Transactional
    public ReservaResponse criar(ReservaRequest req, Usuario solicitante) {
        AreaComum area = areaRepository.findById(req.areaComumId())
                .orElseThrow(() -> new ResourceNotFoundException("Área comum não encontrada"));

        if (!Boolean.TRUE.equals(area.getAtivo())) {
            throw new BusinessException("Área comum está inativa");
        }

        Unidade unidade = unidadeRepository.findById(req.unidadeId())
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada"));

        if (!Boolean.TRUE.equals(unidade.getAtivo())) {
            throw new BusinessException("Unidade está inativa");
        }

        if (solicitante.getRole() == Role.MORADOR) {
            boolean temVinculo = moradorUnidadeRepository.findByUsuarioId(solicitante.getId())
                    .stream()
                    .anyMatch(mu -> mu.getUnidade().getId().equals(unidade.getId()));
            if (!temVinculo) {
                throw new BusinessException("Você não tem vínculo com essa unidade");
            }
        }

        validarPeriodo(req.inicio(), req.fim(), area);
        validarConflitos(area.getId(), req.inicio(), req.fim(), null);

        Reserva r = Reserva.builder()
                .areaComum(area)
                .unidade(unidade)
                .solicitante(solicitante)
                .inicio(req.inicio())
                .fim(req.fim())
                .status(StatusReserva.PENDENTE)
                .observacao(req.observacao())
                .build();

        return ReservaResponse.from(repository.save(r));
    }

    @Transactional
    public ReservaResponse alterarStatus(Long id, AlterarStatusReservaRequest req, Usuario executor) {
        Reserva r = obter(id);
        StatusReserva atual = r.getStatus();
        StatusReserva novo  = req.status();

        if (atual == novo) {
            throw new BusinessException("Reserva já está com esse status");
        }

        Set<StatusReserva> permitidos = TRANSICOES.getOrDefault(atual, Set.of());
        if (!permitidos.contains(novo)) {
            throw new BusinessException("Transição inválida: " + atual + " → " + novo);
        }

        // Morador só pode cancelar a própria reserva
        if (executor.getRole() == Role.MORADOR) {
            if (novo != StatusReserva.CANCELADA) {
                throw new BusinessException("Morador só pode cancelar a própria reserva");
            }
            if (!r.getSolicitante().getId().equals(executor.getId())) {
                throw new BusinessException("Você só pode cancelar reservas feitas por você");
            }
        }

        // Revalida conflitos ao APROVAR (proteção contra reservas criadas nesse meio-tempo)
        if (novo == StatusReserva.APROVADA) {
            validarConflitos(r.getAreaComum().getId(), r.getInicio(), r.getFim(), r.getId());
        }

        r.setStatus(novo);
        return ReservaResponse.from(repository.save(r));
    }

    @Transactional
    public void deletar(Long id) {
        Reserva r = obter(id);
        if (r.getStatus() == StatusReserva.APROVADA || r.getStatus() == StatusReserva.CONCLUIDA) {
            throw new BusinessException(
                    "Não é possível deletar reserva aprovada ou concluída (histórico)");
        }
        repository.delete(r);
    }

    // --------- helpers ---------

    private Reserva obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva não encontrada: " + id));
    }

    private void validarVisibilidade(Reserva r, Usuario solicitante) {
        if (solicitante.getRole() == Role.MORADOR
                && !r.getSolicitante().getId().equals(solicitante.getId())) {
            throw new BusinessException("Você não tem acesso a essa reserva");
        }
    }

    private void validarPeriodo(Instant inicio, Instant fim, AreaComum area) {
        if (!inicio.isBefore(fim)) {
            throw new BusinessException("O horário de término deve ser posterior ao de início");
        }

        var inicioLocal = inicio.atZone(ZONE);
        var fimLocal = fim.atZone(ZONE);

        LocalDate diaInicio = inicioLocal.toLocalDate();
        LocalDate diaFim = fimLocal.toLocalDate();

        if (!diaInicio.equals(diaFim)) {
            throw new BusinessException("Reserva deve ocorrer no mesmo dia");
        }

        LocalTime tIni = inicioLocal.toLocalTime();
        LocalTime tFim = fimLocal.toLocalTime();

        if (tIni.isBefore(area.getHorarioIni())) {
            throw new BusinessException(
                    "Início fora do horário permitido da área ("
                            + area.getHorarioIni() + " – " + area.getHorarioFim() + ")");
        }
        if (tFim.isAfter(area.getHorarioFim())) {
            throw new BusinessException(
                    "Término fora do horário permitido da área ("
                            + area.getHorarioIni() + " – " + area.getHorarioFim() + ")");
        }
    }

    private void validarConflitos(Long areaId, Instant inicio, Instant fim, Long ignorarId) {
        List<Reserva> conflitos = repository.findConflitos(areaId, inicio, fim);
        if (ignorarId != null) {
            conflitos = conflitos.stream()
                    .filter(r -> !r.getId().equals(ignorarId))
                    .toList();
        }
        if (!conflitos.isEmpty()) {
            throw new BusinessException(
                    "Já existe reserva no período informado para essa área");
        }
    }
}