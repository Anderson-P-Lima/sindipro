package com.sindipro.api.comunicado;

import com.sindipro.api.comunicado.dto.ComunicadoRequest;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import com.sindipro.api.usuario.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ComunicadoService")
class ComunicadoServiceTest {

    @Mock private ComunicadoRepository repository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CondominioService condominioService;

    @InjectMocks private ComunicadoService service;

    private Condominio condominio;
    private Usuario autor;
    private Comunicado comunicado;

    @BeforeEach
    void setup() {
        condominio = Condominio.builder().id(1L).build();
        autor = Usuario.builder().id(2L).nome("Carlos").role(Role.SINDICO).build();
        comunicado = Comunicado.builder()
                .id(1L).condominio(condominio).autor(autor)
                .titulo("Aviso").conteudo("Teste")
                .categoria(CategoriaComunicado.GERAL).fixado(false)
                .build();
    }

    @Test
    @DisplayName("buscar: não encontrado")
    void buscar_naoEncontrado() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscar(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("buscar: encontrado")
    void buscar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(comunicado));
        var resp = service.buscar(1L);
        assertThat(resp.titulo()).isEqualTo("Aviso");
    }

    @Test
    @DisplayName("criar: resolve autor pelo e-mail")
    void criar_sucesso() {
        var req = new ComunicadoRequest("Novo", "Conteúdo",
                CategoriaComunicado.MANUTENCAO, true);

        when(usuarioRepository.findByEmail("carlos@teste.com")).thenReturn(Optional.of(autor));
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.save(any(Comunicado.class))).thenAnswer(inv -> {
            Comunicado c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        var resp = service.criar(req, "carlos@teste.com");
        assertThat(resp.id()).isEqualTo(10L);
        assertThat(resp.fixado()).isTrue();
    }

    @Test
    @DisplayName("criar: autor inexistente")
    void criar_autorInexistente() {
        var req = new ComunicadoRequest("Novo", "Conteúdo",
                CategoriaComunicado.GERAL, false);
        when(usuarioRepository.findByEmail("x@teste.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.criar(req, "x@teste.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("atualizar: substitui campos")
    void atualizar_sucesso() {
        var req = new ComunicadoRequest("Novo título", "Novo conteúdo",
                CategoriaComunicado.URGENTE, true);

        when(repository.findById(1L)).thenReturn(Optional.of(comunicado));
        when(repository.save(any(Comunicado.class))).thenReturn(comunicado);

        var resp = service.atualizar(1L, req);
        assertThat(resp.titulo()).isEqualTo("Novo título");
        assertThat(resp.fixado()).isTrue();
    }

    @Test
    @DisplayName("deletar: hard delete")
    void deletar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(comunicado));

        service.deletar(1L);
        verify(repository).delete(comunicado);
    }
}