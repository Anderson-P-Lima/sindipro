package com.sindipro.api.unidade;

import com.sindipro.api.bloco.Bloco;
import com.sindipro.api.bloco.BlocoRepository;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.dto.UnidadeRequest;
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
@DisplayName("UnidadeService")
class UnidadeServiceTest {

    @Mock private UnidadeRepository repository;
    @Mock private BlocoRepository blocoRepository;

    @InjectMocks private UnidadeService service;

    private Bloco bloco;
    private Unidade unidade;

    @BeforeEach
    void setup() {
        bloco = Bloco.builder().id(1L).nome("Bloco A").build();
        unidade = Unidade.builder()
                .id(1L).bloco(bloco).numero("101").andar(1).ativo(true)
                .build();
    }

    private UnidadeRequest reqValido() {
        return new UnidadeRequest(1L, "101", 1);
    }

    @Test
    @DisplayName("listar: filtra por bloco e ativo")
    void listar() {
        when(repository.findAll()).thenReturn(List.of(unidade));
        assertThat(service.listar(1L, true)).hasSize(1);
        assertThat(service.listar(99L, null)).isEmpty();
    }

    @Test
    @DisplayName("buscar: não encontrada")
    void buscar_naoEncontrada() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.buscar(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("criar: sucesso")
    void criar_sucesso() {
        when(blocoRepository.findById(1L)).thenReturn(Optional.of(bloco));
        when(repository.findByBlocoId(1L)).thenReturn(List.of());
        when(repository.save(any(Unidade.class))).thenReturn(unidade);

        assertThat(service.criar(reqValido()).numero()).isEqualTo("101");
    }

    @Test
    @DisplayName("criar: bloco inexistente")
    void criar_blocoInexistente() {
        when(blocoRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.criar(reqValido()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("criar: número duplicado no bloco")
    void criar_duplicada() {
        when(blocoRepository.findById(1L)).thenReturn(Optional.of(bloco));
        when(repository.findByBlocoId(1L)).thenReturn(List.of(unidade));

        assertThatThrownBy(() -> service.criar(reqValido()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe uma unidade");
    }

    @Test
    @DisplayName("criar: número duplicado em unidade INATIVA é permitido")
    void criar_reativaNumero() {
        unidade.setAtivo(false);
        when(blocoRepository.findById(1L)).thenReturn(Optional.of(bloco));
        when(repository.findByBlocoId(1L)).thenReturn(List.of(unidade));
        when(repository.save(any(Unidade.class))).thenReturn(unidade);

        // Não lança — unidade inativa não bloqueia
        service.criar(reqValido());
        verify(repository).save(any());
    }

    @Test
    @DisplayName("atualizar: sucesso")
    void atualizar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(unidade));
        when(blocoRepository.findById(1L)).thenReturn(Optional.of(bloco));
        when(repository.save(any(Unidade.class))).thenReturn(unidade);

        service.atualizar(1L, new UnidadeRequest(1L, "102", 2));
        assertThat(unidade.getNumero()).isEqualTo("102");
    }

    @Test
    @DisplayName("alterarStatus: desativa")
    void alterarStatus() {
        when(repository.findById(1L)).thenReturn(Optional.of(unidade));
        when(repository.save(any(Unidade.class))).thenReturn(unidade);

        assertThat(service.alterarStatus(1L, false).ativo()).isFalse();
    }

    @Test
    @DisplayName("deletar: soft delete")
    void deletar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(unidade));
        when(repository.save(any(Unidade.class))).thenReturn(unidade);

        service.deletar(1L);
        assertThat(unidade.getAtivo()).isFalse();
        verify(repository, never()).delete(any(Unidade.class));
    }
}