package com.sindipro.api.bloco;

import com.sindipro.api.bloco.dto.BlocoRequest;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.UnidadeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BlocoService")
class BlocoServiceTest {

    @Mock private BlocoRepository repository;
    @Mock private UnidadeRepository unidadeRepository;
    @Mock private CondominioService condominioService;

    @InjectMocks private BlocoService service;

    private Condominio condominio;
    private Bloco bloco;

    @BeforeEach
    void setup() {
        condominio = Condominio.builder().id(1L).build();
        bloco = Bloco.builder().id(1L).condominio(condominio).nome("Bloco A").build();
    }

    @Test
    @DisplayName("listar: retorna blocos do condomínio")
    void listar() {
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.findByCondominioId(1L)).thenReturn(List.of(bloco));

        assertThat(service.listar()).hasSize(1);
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
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.findByCondominioId(1L)).thenReturn(List.of());
        when(repository.save(any(Bloco.class))).thenReturn(bloco);

        var resp = service.criar(new BlocoRequest("Bloco A"));
        assertThat(resp.nome()).isEqualTo("Bloco A");
    }

    @Test
    @DisplayName("criar: nome duplicado")
    void criar_duplicado() {
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.findByCondominioId(1L)).thenReturn(List.of(bloco));

        assertThatThrownBy(() -> service.criar(new BlocoRequest("Bloco A")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe");
    }

    @Test
    @DisplayName("atualizar: sucesso")
    void atualizar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(bloco));
        when(repository.save(any(Bloco.class))).thenReturn(bloco);

        service.atualizar(1L, new BlocoRequest("Bloco B"));
        assertThat(bloco.getNome()).isEqualTo("Bloco B");
    }

    @Test
    @DisplayName("deletar: bloqueia com unidades")
    void deletar_comUnidades() {
        when(repository.findById(1L)).thenReturn(Optional.of(bloco));
        when(unidadeRepository.findByBlocoId(1L))
                .thenReturn(List.of(new com.sindipro.api.unidade.Unidade()));

        assertThatThrownBy(() -> service.deletar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("unidades");
    }

    @Test
    @DisplayName("deletar: hard delete sem unidades")
    void deletar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(bloco));
        when(unidadeRepository.findByBlocoId(1L)).thenReturn(List.of());

        service.deletar(1L);
        verify(repository).delete(bloco);
    }
}