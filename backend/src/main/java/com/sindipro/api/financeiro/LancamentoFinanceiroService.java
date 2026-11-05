package com.sindipro.api.financeiro;

import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.financeiro.dto.LancamentoRequest;
import com.sindipro.api.financeiro.dto.LancamentoResponse;
import com.sindipro.api.financeiro.dto.RegistrarPagamentoRequest;
import com.sindipro.api.moradorunidade.MoradorUnidade;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
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

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LancamentoFinanceiroService {

    private final LancamentoFinanceiroRepository repository;
    private final UnidadeRepository unidadeRepository;
    private final MoradorUnidadeRepository moradorUnidadeRepository;
    private final CondominioService condominioService;

    @Transactional(readOnly = true)
    public PageResponse<LancamentoResponse> listar(
            Pageable pageable,
            TipoLancamento tipo,
            StatusLancamento status,
            Long unidadeId,
            Usuario solicitante) {

        Condominio cond = condominioService.obterAtual();

        // Morador só vê lançamentos das suas unidades
        List<Long> unidadesDoMorador = null;
        if (solicitante.getRole() == Role.MORADOR) {
            unidadesDoMorador = moradorUnidadeRepository.findByUsuarioId(solicitante.getId())
                    .stream()
                    .map(mu -> mu.getUnidade().getId())
                    .toList();
        }
        final List<Long> unidadesFiltro = unidadesDoMorador;

        Page<LancamentoFinanceiro> page = repository.findAll((root, query, cb) -> {
            var ps = new ArrayList<Predicate>();
            ps.add(cb.equal(root.get("condominio").get("id"), cond.getId()));

            if (tipo != null)   ps.add(cb.equal(root.get("tipo"), tipo));
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (unidadeId != null) ps.add(cb.equal(root.get("unidade").get("id"), unidadeId));

            if (unidadesFiltro != null) {
                if (unidadesFiltro.isEmpty()) {
                    // Morador sem vínculo não vê nada
                    ps.add(cb.disjunction());
                } else {
                    ps.add(root.get("unidade").get("id").in(unidadesFiltro));
                }
            }

            return cb.and(ps.toArray(new Predicate[0]));
        }, pageable);

        return PageResponse.from(page, LancamentoResponse::from);
    }

    @Transactional(readOnly = true)
    public LancamentoResponse buscar(Long id, Usuario solicitante) {
        LancamentoFinanceiro l = obter(id);
        validarVisibilidade(l, solicitante);
        return LancamentoResponse.from(l);
    }

    @Transactional
    public LancamentoResponse criar(LancamentoRequest req, Usuario autor) {
        Condominio cond = condominioService.obterAtual();

        Unidade unidade = null;
        if (req.unidadeId() != null) {
            unidade = unidadeRepository.findById(req.unidadeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada"));
        }

        LancamentoFinanceiro l = LancamentoFinanceiro.builder()
                .condominio(cond)
                .unidade(unidade)
                .criadoPor(autor)
                .tipo(req.tipo())
                .categoria(req.categoria())
                .descricao(req.descricao())
                .valor(req.valor())
                .dataVencimento(req.dataVencimento())
                .status(StatusLancamento.PENDENTE)
                .build();

        return LancamentoResponse.from(repository.save(l));
    }

    @Transactional
    public LancamentoResponse atualizar(Long id, LancamentoRequest req) {
        LancamentoFinanceiro l = obter(id);

        if (l.getStatus() != StatusLancamento.PENDENTE
                && l.getStatus() != StatusLancamento.ATRASADO) {
            throw new BusinessException(
                    "Só é possível editar lançamentos PENDENTE ou ATRASADO");
        }

        Unidade unidade = null;
        if (req.unidadeId() != null) {
            unidade = unidadeRepository.findById(req.unidadeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada"));
        }

        l.setTipo(req.tipo());
        l.setCategoria(req.categoria());
        l.setDescricao(req.descricao());
        l.setValor(req.valor());
        l.setDataVencimento(req.dataVencimento());
        l.setUnidade(unidade);

        return LancamentoResponse.from(repository.save(l));
    }

    @Transactional
    public LancamentoResponse registrarPagamento(Long id, RegistrarPagamentoRequest req) {
        LancamentoFinanceiro l = obter(id);

        if (l.getStatus() != StatusLancamento.PENDENTE
                && l.getStatus() != StatusLancamento.ATRASADO) {
            throw new BusinessException(
                    "Só é possível registrar pagamento em lançamentos PENDENTE ou ATRASADO");
        }

        l.setStatus(StatusLancamento.PAGO);
        l.setDataPagamento(req.dataPagamento());

        return LancamentoResponse.from(repository.save(l));
    }

    @Transactional
    public LancamentoResponse cancelar(Long id) {
        LancamentoFinanceiro l = obter(id);

        if (l.getStatus() != StatusLancamento.PENDENTE
                && l.getStatus() != StatusLancamento.ATRASADO) {
            throw new BusinessException(
                    "Só é possível cancelar lançamentos PENDENTE ou ATRASADO");
        }

        l.setStatus(StatusLancamento.CANCELADO);
        return LancamentoResponse.from(repository.save(l));
    }

    @Transactional
    public void deletar(Long id) {
        LancamentoFinanceiro l = obter(id);
        if (l.getStatus() != StatusLancamento.PENDENTE) {
            throw new BusinessException(
                    "Só é possível deletar lançamentos PENDENTE (histórico preservado)");
        }
        repository.delete(l);
    }

    private LancamentoFinanceiro obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento não encontrado: " + id));
    }

    private void validarVisibilidade(LancamentoFinanceiro l, Usuario solicitante) {
        if (solicitante.getRole() != Role.MORADOR) return;

        boolean temVinculo = l.getUnidade() != null
                && moradorUnidadeRepository.findByUsuarioId(solicitante.getId())
                .stream()
                .anyMatch(mu -> mu.getUnidade().getId().equals(l.getUnidade().getId()));

        if (!temVinculo) {
            throw new BusinessException("Você não tem acesso a esse lançamento");
        }
    }
}