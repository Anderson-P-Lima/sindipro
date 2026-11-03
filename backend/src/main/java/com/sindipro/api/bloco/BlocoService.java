package com.sindipro.api.bloco;

import com.sindipro.api.bloco.dto.BlocoRequest;
import com.sindipro.api.bloco.dto.BlocoResponse;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.UnidadeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlocoService {

    private final BlocoRepository repository;
    private final UnidadeRepository unidadeRepository;
    private final CondominioService condominioService;

    @Transactional(readOnly = true)
    public List<BlocoResponse> listar() {
        Condominio c = condominioService.obterAtual();
        return repository.findByCondominioId(c.getId()).stream()
                .map(BlocoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public BlocoResponse buscar(Long id) {
        return BlocoResponse.from(obter(id));
    }

    @Transactional
    public BlocoResponse criar(BlocoRequest req) {
        Condominio c = condominioService.obterAtual();

        boolean jaExiste = repository.findByCondominioId(c.getId()).stream()
                .anyMatch(b -> b.getNome().equalsIgnoreCase(req.nome()));
        if (jaExiste) {
            throw new BusinessException("Já existe um bloco com esse nome");
        }

        Bloco b = Bloco.builder()
                .condominio(c)
                .nome(req.nome())
                .build();
        return BlocoResponse.from(repository.save(b));
    }

    @Transactional
    public BlocoResponse atualizar(Long id, BlocoRequest req) {
        Bloco b = obter(id);
        b.setNome(req.nome());
        return BlocoResponse.from(repository.save(b));
    }

    @Transactional
    public void deletar(Long id) {
        Bloco b = obter(id);
        if (!unidadeRepository.findByBlocoId(id).isEmpty()) {
            throw new BusinessException(
                    "Não é possível excluir bloco com unidades vinculadas");
        }
        repository.delete(b);
    }

    private Bloco obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bloco não encontrado: " + id));
    }
}