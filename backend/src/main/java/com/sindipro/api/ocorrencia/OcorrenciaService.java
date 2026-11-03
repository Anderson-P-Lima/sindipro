package com.sindipro.api.ocorrencia;

import com.sindipro.api.moradorunidade.MoradorUnidade;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.ocorrencia.dto.*;
import com.sindipro.api.shared.dto.PageResponse;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.Unidade;
import com.sindipro.api.unidade.UnidadeRepository;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OcorrenciaService {

    private static final Map<StatusOcorrencia, Set<StatusOcorrencia>> TRANSICOES = Map.of(
            StatusOcorrencia.ABERTA,       Set.of(StatusOcorrencia.EM_ANDAMENTO, StatusOcorrencia.CANCELADA),
            StatusOcorrencia.EM_ANDAMENTO, Set.of(StatusOcorrencia.RESOLVIDA, StatusOcorrencia.CANCELADA),
            StatusOcorrencia.RESOLVIDA,    Set.of(),
            StatusOcorrencia.CANCELADA,    Set.of()
    );

    private final OcorrenciaRepository repository;
    private final UnidadeRepository unidadeRepository;
    private final UsuarioRepository usuarioRepository;
    private final MoradorUnidadeRepository moradorUnidadeRepository;

    @Transactional(readOnly = true)
    public PageResponse<OcorrenciaResponse> listar(
            Pageable pageable,
            StatusOcorrencia status,
            PrioridadeOcorrencia prioridade,
            Long responsavelId,
            Usuario solicitante) {

        Page<Ocorrencia> page = repository.findAll((root, query, cb) -> {
            var ps = new ArrayList<Predicate>();

            if (status != null)        ps.add(cb.equal(root.get("status"), status));
            if (prioridade != null)    ps.add(cb.equal(root.get("prioridade"), prioridade));
            if (responsavelId != null) ps.add(cb.equal(root.get("responsavel").get("id"), responsavelId));

            if (solicitante.getRole() == Role.MORADOR) {
                ps.add(cb.equal(root.get("autor").get("id"), solicitante.getId()));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        }, pageable);

        return PageResponse.from(page, OcorrenciaResponse::from);
    }

    @Transactional(readOnly = true)
    public OcorrenciaResponse buscar(Long id, Usuario solicitante) {
        Ocorrencia o = obter(id);
        validarVisibilidade(o, solicitante);
        return OcorrenciaResponse.from(o);
    }

    @Transactional
    public OcorrenciaResponse criar(OcorrenciaRequest req, Usuario autor) {
        Unidade unidade = resolverUnidade(req.unidadeId(), autor);

        Ocorrencia o = Ocorrencia.builder()
                .titulo(req.titulo())
                .descricao(req.descricao())
                .prioridade(req.prioridade() != null ? req.prioridade() : PrioridadeOcorrencia.MEDIA)
                .status(StatusOcorrencia.ABERTA)
                .autor(autor)
                .unidade(unidade)
                .build();

        return OcorrenciaResponse.from(repository.save(o));
    }

    @Transactional
    public OcorrenciaResponse alterarStatus(Long id, AlterarStatusRequest req, Usuario executor) {
        Ocorrencia o = obter(id);

        StatusOcorrencia atual = o.getStatus();
        StatusOcorrencia novo  = req.status();

        if (atual == novo) {
            throw new BusinessException("Ocorrência já está com esse status");
        }

        Set<StatusOcorrencia> permitidos = TRANSICOES.getOrDefault(atual, Set.of());
        if (!permitidos.contains(novo)) {
            throw new BusinessException(
                    "Transição inválida: " + atual + " → " + novo);
        }

        // Morador não pode mover status livremente; apenas cancelar a própria
        if (executor.getRole() == Role.MORADOR) {
            if (novo != StatusOcorrencia.CANCELADA) {
                throw new BusinessException(
                        "Morador só pode cancelar a própria ocorrência");
            }
            if (!o.getAutor().getId().equals(executor.getId())) {
                throw new BusinessException(
                        "Você só pode cancelar ocorrências abertas por você");
            }
        }

        o.setStatus(novo);
        if (novo == StatusOcorrencia.RESOLVIDA) {
            o.setResolvidoEm(Instant.now());
        }

        return OcorrenciaResponse.from(repository.save(o));
    }

    @Transactional
    public OcorrenciaResponse atribuirResponsavel(Long id, AtribuirResponsavelRequest req) {
        Ocorrencia o = obter(id);

        if (o.getStatus() != StatusOcorrencia.ABERTA && o.getStatus() != StatusOcorrencia.EM_ANDAMENTO) {
            throw new BusinessException(
                    "Só é possível atribuir responsável em ocorrências ABERTA ou EM_ANDAMENTO");
        }

        Usuario responsavel = usuarioRepository.findById(req.responsavelId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuário responsável não encontrado"));

        if (responsavel.getRole() != Role.ZELADOR
                && responsavel.getRole() != Role.SINDICO
                && responsavel.getRole() != Role.ADMIN_SISTEMA) {
            throw new BusinessException(
                    "Responsável deve ser um síndico, zelador ou admin");
        }

        o.setResponsavel(responsavel);
        return OcorrenciaResponse.from(repository.save(o));
    }

    @Transactional
    public void deletar(Long id) {
        Ocorrencia o = obter(id);
        if (o.getStatus() == StatusOcorrencia.EM_ANDAMENTO
                || o.getStatus() == StatusOcorrencia.RESOLVIDA) {
            throw new BusinessException(
                    "Não é possível deletar ocorrência em andamento ou resolvida (histórico)");
        }
        repository.delete(o);
    }

    // --------- helpers ---------

    private Ocorrencia obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ocorrência não encontrada: " + id));
    }

    private void validarVisibilidade(Ocorrencia o, Usuario solicitante) {
        if (solicitante.getRole() == Role.MORADOR
                && !o.getAutor().getId().equals(solicitante.getId())) {
            throw new BusinessException("Você não tem acesso a essa ocorrência");
        }
    }

    private Unidade resolverUnidade(Long unidadeId, Usuario autor) {
        if (unidadeId != null) {
            Unidade u = unidadeRepository.findById(unidadeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada"));
            if (autor.getRole() == Role.MORADOR) {
                boolean temVinculo = moradorUnidadeRepository.findByUsuarioId(autor.getId())
                        .stream()
                        .anyMatch(mu -> mu.getUnidade().getId().equals(unidadeId));
                if (!temVinculo) {
                    throw new BusinessException("Você não tem vínculo com essa unidade");
                }
            }
            return u;
        }

        if (autor.getRole() == Role.MORADOR) {
            return moradorUnidadeRepository.findByUsuarioId(autor.getId())
                    .stream()
                    .map(MoradorUnidade::getUnidade)
                    .findFirst()
                    .orElse(null);
        }

        return null;
    }
}