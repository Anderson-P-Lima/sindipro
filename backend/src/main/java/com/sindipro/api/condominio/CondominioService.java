package com.sindipro.api.condominio;

import com.sindipro.api.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CondominioService {

    private final CondominioRepository repository;

    /**
     * Retorna o condomínio "atual". No MVP há apenas um por instalação.
     */
    @Transactional(readOnly = true)
    public Condominio obterAtual() {
        return repository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Condomínio não configurado. Execute o seed inicial."));
    }
}