package com.sindipro.api.area;

import com.sindipro.api.area.dto.AreaComumRequest;
import com.sindipro.api.area.dto.AreaComumResponse;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.reserva.ReservaRepository;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceConflictException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AreaComumService {

    private final AreaComumRepository repository;
    private final ReservaRepository reservaRepository;
    private final CondominioService condominioService;

    @Transactional(readOnly = true)
    public List<AreaComumResponse> listar(Boolean ativo) {
        Condominio c = condominioService.obterAtual();
        Boolean filtro = ativo != null ? ativo : Boolean.TRUE;  // padrão: apenas ativas
        return repository.findByCondominioId(c.getId()).stream()
                .filter(a -> a.getAtivo().equals(filtro))
                .map(AreaComumResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AreaComumResponse buscar(Long id) {
        return AreaComumResponse.from(obter(id));
    }

    @Transactional
    public AreaComumResponse criar(AreaComumRequest req) {
        validarHorario(req);
        Condominio c = condominioService.obterAtual();

        if (repository.existsByCondominioIdAndNomeIgnoreCaseAndAtivoTrue(c.getId(), req.nome())) {
            throw new ResourceConflictException("Já existe uma área comum ativa com esse nome");
        }

        AreaComum a = AreaComum.builder()
                .condominio(c)
                .nome(req.nome())
                .descricao(req.descricao())
                .capacidade(req.capacidade())
                .horarioIni(req.horarioIni())
                .horarioFim(req.horarioFim())
                .taxa(req.taxa())
                .ativo(true)
                .build();

        return AreaComumResponse.from(repository.save(a));
    }

    @Transactional
    public AreaComumResponse atualizar(Long id, AreaComumRequest req) {
        validarHorario(req);
        AreaComum a = obter(id);
        Condominio c = a.getCondominio();

        // Se o nome mudou, verifica unicidade
        if (!a.getNome().equalsIgnoreCase(req.nome())
                && repository.existsByCondominioIdAndNomeIgnoreCaseAndAtivoTrue(c.getId(), req.nome())) {
            throw new ResourceConflictException("Já existe uma área comum ativa com esse nome");
        }

        a.setNome(req.nome());
        a.setDescricao(req.descricao());
        a.setCapacidade(req.capacidade());
        a.setHorarioIni(req.horarioIni());
        a.setHorarioFim(req.horarioFim());
        a.setTaxa(req.taxa());

        return AreaComumResponse.from(repository.save(a));
    }

    @Transactional
    public AreaComumResponse alterarStatus(Long id, boolean ativo) {
        AreaComum a = obter(id);
        a.setAtivo(ativo);
        return AreaComumResponse.from(repository.save(a));
    }

    @Transactional
    public void deletar(Long id) {
        AreaComum a = obter(id);

        if (reservaRepository.existsReservaAtivaPorArea(id)) {
            throw new BusinessException(
                    "Não é possível excluir área com reservas pendentes ou aprovadas");
        }

        a.setAtivo(false);
        repository.save(a);
    }

    private AreaComum obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Área comum não encontrada: " + id));
    }

    private void validarHorario(AreaComumRequest req) {
        if (!req.horarioFim().isAfter(req.horarioIni())) {
            throw new BusinessException(
                    "O horário de término deve ser posterior ao horário de início");
        }
    }
}