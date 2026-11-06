package com.sindipro.api.usuario;

import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceConflictException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.usuario.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UsuarioService")
class UsuarioServiceTest {

    @Mock private UsuarioRepository repository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UsuarioService service;

    private Usuario usuario;

    @BeforeEach
    void setup() {
        usuario = Usuario.builder()
                .id(1L)
                .nome("Maria")
                .email("maria@teste.com")
                .senhaHash("hash-antigo")
                .role(Role.MORADOR)
                .ativo(true)
                .build();
    }

    @Test
    @DisplayName("buscar: retorna usuário existente")
    void buscar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(usuario));
        var resp = service.buscar(1L);
        assertThat(resp.email()).isEqualTo("maria@teste.com");
    }

    @Test
    @DisplayName("buscar: não encontrado")
    void buscar_naoEncontrado() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscar(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("criar: sucesso")
    void criar_sucesso() {
        var req = new UsuarioRequest("João", "joao@teste.com", "senha123",
                null, null, Role.MORADOR);

        when(repository.existsByEmail("joao@teste.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("hash-novo");
        when(repository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });

        var resp = service.criar(req);
        assertThat(resp.email()).isEqualTo("joao@teste.com");
        verify(passwordEncoder).encode("senha123");
    }

    @Test
    @DisplayName("criar: e-mail duplicado")
    void criar_emailDuplicado() {
        var req = new UsuarioRequest("João", "joao@teste.com", "senha123",
                null, null, Role.MORADOR);
        when(repository.existsByEmail("joao@teste.com")).thenReturn(true);

        assertThatThrownBy(() -> service.criar(req))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("E-mail");
    }

    @Test
    @DisplayName("criar: CPF duplicado")
    void criar_cpfDuplicado() {
        var req = new UsuarioRequest("João", "joao@teste.com", "senha123",
                "123.456.789-00", null, Role.MORADOR);

        Usuario outro = Usuario.builder().cpf("123.456.789-00").build();

        when(repository.existsByEmail("joao@teste.com")).thenReturn(false);
        when(repository.findAll()).thenReturn(java.util.List.of(outro));

        assertThatThrownBy(() -> service.criar(req))
                .isInstanceOf(ResourceConflictException.class)
                .hasMessageContaining("CPF");
    }

    @Test
    @DisplayName("atualizar: sucesso")
    void atualizar_sucesso() {
        var req = new UsuarioUpdateRequest("Maria Silva", "maria@teste.com",
                null, "11999999999", Role.MORADOR);

        when(repository.findById(1L)).thenReturn(Optional.of(usuario));
        when(repository.save(any(Usuario.class))).thenReturn(usuario);

        var resp = service.atualizar(1L, req);
        assertThat(resp.nome()).isEqualTo("Maria Silva");
    }

    @Test
    @DisplayName("atualizar: e-mail já em uso por outro")
    void atualizar_emailConflito() {
        var req = new UsuarioUpdateRequest("Maria", "novo@teste.com",
                null, null, Role.MORADOR);

        when(repository.findById(1L)).thenReturn(Optional.of(usuario));
        when(repository.existsByEmail("novo@teste.com")).thenReturn(true);

        assertThatThrownBy(() -> service.atualizar(1L, req))
                .isInstanceOf(ResourceConflictException.class);
    }

    @Test
    @DisplayName("alterarStatus: desativa usuário")
    void alterarStatus() {
        when(repository.findById(1L)).thenReturn(Optional.of(usuario));
        when(repository.save(any(Usuario.class))).thenReturn(usuario);

        var resp = service.alterarStatus(1L, false);
        assertThat(resp.ativo()).isFalse();
    }

    @Test
    @DisplayName("deletar: soft delete (ativo = false)")
    void deletar_softDelete() {
        when(repository.findById(1L)).thenReturn(Optional.of(usuario));
        when(repository.save(any(Usuario.class))).thenReturn(usuario);

        service.deletar(1L);

        assertThat(usuario.getAtivo()).isFalse();
        verify(repository).save(usuario);
        verify(repository, never()).delete(any(Usuario.class));
    }

    @Test
    @DisplayName("alterarPropriaSenha: sucesso")
    void alterarSenha_sucesso() {
        var req = new AlterarSenhaRequest("senha-atual", "nova-senha");

        when(repository.findByEmail("maria@teste.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("senha-atual", "hash-antigo")).thenReturn(true);
        when(passwordEncoder.encode("nova-senha")).thenReturn("hash-novo");
        when(repository.save(any(Usuario.class))).thenReturn(usuario);

        service.alterarPropriaSenha("maria@teste.com", req);

        assertThat(usuario.getSenhaHash()).isEqualTo("hash-novo");
    }

    @Test
    @DisplayName("alterarPropriaSenha: senha atual errada")
    void alterarSenha_senhaErrada() {
        var req = new AlterarSenhaRequest("errada", "nova-senha");

        when(repository.findByEmail("maria@teste.com")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("errada", "hash-antigo")).thenReturn(false);

        assertThatThrownBy(() -> service.alterarPropriaSenha("maria@teste.com", req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("incorreta");

        verify(repository, never()).save(any());
    }
}