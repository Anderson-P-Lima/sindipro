package com.sindipro.api.unidade;

import com.sindipro.api.bloco.Bloco;
import com.sindipro.api.bloco.BlocoRepository;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.dto.UnidadeRequest;
import com.sindipro.api.unidade.dto.UnidadeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UnidadeService {

    private final UnidadeRepository repository;
    private final BlocoRepository blocoRepository;

    @Transactional(readOnly = true)
    public List<UnidadeResponse> listar(Long blocoId, Boolean ativo) {
        return repository.findAll().stream()
                .filter(u -> blocoId == null || u.getBloco().getId().equals(blocoId))
                .filter(u -> ativo == null || u.getAtivo().equals(ativo))
                .map(UnidadeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnidadeResponse buscar(Long id) {
        return UnidadeResponse.from(obter(id));
    }

    @Transactional
    public UnidadeResponse criar(UnidadeRequest req) {
        Bloco bloco = blocoRepository.findById(req.blocoId())
                .orElseThrow(() -> new ResourceNotFoundException("Bloco não encontrado"));

        boolean duplicada = repository.findByBlocoId(bloco.getId()).stream()
                .filter(u -> Boolean.TRUE.equals(u.getAtivo()))
                .anyMatch(u -> u.getNumero().equalsIgnoreCase(req.numero()));
        if (duplicada) {
            throw new BusinessException("Já existe uma unidade com esse número nesse bloco");
        }

        Unidade u = Unidade.builder()
                .bloco(bloco)
                .numero(req.numero())
                .andar(req.andar())
                .ativo(true)
                .build();
        return UnidadeResponse.from(repository.save(u));
    }

    @Transactional
    public UnidadeResponse atualizar(Long id, UnidadeRequest req) {
        Unidade u = obter(id);
        Bloco bloco = blocoRepository.findById(req.blocoId())
                .orElseThrow(() -> new ResourceNotFoundException("Bloco não encontrado"));

        u.setBloco(bloco);
        u.setNumero(req.numero());
        u.setAndar(req.andar());

        return UnidadeResponse.from(repository.save(u));
    }

    @Transactional
    public UnidadeResponse alterarStatus(Long id, boolean ativo) {
        Unidade u = obter(id);
        u.setAtivo(ativo);
        return UnidadeResponse.from(repository.save(u));
    }

    @Transactional
    public void deletar(Long id) {
        Unidade u = obter(id);
        u.setAtivo(false);
        repository.save(u);
    }

    private Unidade obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Unidade não encontrada: " + id));
    }
}