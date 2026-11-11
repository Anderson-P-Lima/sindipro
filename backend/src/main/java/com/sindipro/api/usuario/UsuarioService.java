package com.sindipro.api.usuario;

import com.sindipro.api.shared.dto.PageResponse;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceConflictException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.usuario.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UsuarioResponse> listar(Pageable pageable, Role role, Boolean ativo) {
        Page<Usuario> page = repository.findAll((root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (ativo != null) {
                predicates.add(cb.equal(root.get("ativo"), ativo));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, pageable);
        return PageResponse.from(page, UsuarioResponse::from);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscar(Long id) {
        return UsuarioResponse.from(obter(id));
    }

    @Transactional
    public UsuarioResponse criar(UsuarioRequest req) {
        if (repository.existsByEmail(req.email())) {
            throw new ResourceConflictException("E-mail já cadastrado");
        }
        if (req.cpf() != null && !req.cpf().isBlank()) {
            boolean cpfEmUso = repository.findAll().stream()
                    .anyMatch(u -> req.cpf().equals(u.getCpf()));
            if (cpfEmUso) throw new ResourceConflictException("CPF já cadastrado");
        }

        Usuario u = Usuario.builder()
                .nome(req.nome())
                .email(req.email())
                .senhaHash(passwordEncoder.encode(req.senha()))
                .cpf(blankToNull(req.cpf()))
                .telefone(blankToNull(req.telefone()))
                .role(req.role())
                .ativo(true)
                .build();

        return UsuarioResponse.from(repository.save(u));
    }

    @Transactional
    public UsuarioResponse atualizar(Long id, UsuarioUpdateRequest req) {
        Usuario u = obter(id);

        if (!u.getEmail().equals(req.email()) && repository.existsByEmail(req.email())) {
            throw new ResourceConflictException("E-mail já em uso");
        }

        u.setNome(req.nome());
        u.setEmail(req.email());
        u.setCpf(blankToNull(req.cpf()));
        u.setTelefone(blankToNull(req.telefone()));
        u.setRole(req.role());

        return UsuarioResponse.from(repository.save(u));
    }

    @Transactional
    public UsuarioResponse alterarStatus(Long id, boolean ativo) {
        Usuario u = obter(id);
        u.setAtivo(ativo);
        return UsuarioResponse.from(repository.save(u));
    }

    @Transactional
    public void deletar(Long id) {
        Usuario u = obter(id);
        u.setAtivo(false);
        repository.save(u);
    }

    @Transactional
    public void alterarPropriaSenha(String email, AlterarSenhaRequest req) {
        Usuario u = repository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(req.senhaAtual(), u.getSenhaHash())) {
            throw new BusinessException("Senha atual incorreta");
        }
        u.setSenhaHash(passwordEncoder.encode(req.novaSenha()));
        repository.save(u);
    }

    private Usuario obter(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}