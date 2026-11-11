package com.sindipro.api.ocorrencia;

import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.ocorrencia.dto.AlterarStatusRequest;
import com.sindipro.api.ocorrencia.dto.AtribuirResponsavelRequest;
import com.sindipro.api.ocorrencia.dto.OcorrenciaRequest;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.unidade.UnidadeRepository;
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

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OcorrenciaService")
class OcorrenciaServiceTest {

    @Mock private OcorrenciaRepository ocorrenciaRepository;
    @Mock private UnidadeRepository unidadeRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private MoradorUnidadeRepository moradorUnidadeRepository;

    @InjectMocks private OcorrenciaService service;

    private Usuario autor;
    private Usuario staff;
    private Usuario zelador;
    private Ocorrencia ocorrenciaAberta;

    @BeforeEach
    void setup() {
        autor = Usuario.builder().id(3L).nome("Maria").role(Role.MORADOR).build();
        staff = Usuario.builder().id(2L).nome("Carlos").role(Role.SINDICO).build();
        zelador = Usuario.builder().id(5L).nome("Pedro").role(Role.ZELADOR).build();

        ocorrenciaAberta = Ocorrencia.builder()
                .id(1L)
                .titulo("Vazamento")
                .descricao("...")
                .prioridade(PrioridadeOcorrencia.ALTA)
                .status(StatusOcorrencia.ABERTA)
                .autor(autor)
                .build();
    }

    @Test
    @DisplayName("criar: morador cria ocorrência ABERTA")
    void criar_sucesso() {
        when(moradorUnidadeRepository.findByUsuarioId(3L)).thenReturn(Collections.emptyList());
        when(ocorrenciaRepository.save(any(Ocorrencia.class))).thenAnswer(inv -> {
            Ocorrencia o = inv.getArgument(0);
            o.setId(10L);
            return o;
        });

        var resp = service.criar(
                new OcorrenciaRequest("Teste", "Desc", PrioridadeOcorrencia.MEDIA, null),
                autor);

        assertThat(resp.id()).isEqualTo(10L);
        assertThat(resp.status()).isEqualTo(StatusOcorrencia.ABERTA);
    }

    @Test
    @DisplayName("alterarStatus: ABERTA → EM_ANDAMENTO sucesso")
    void transicao_valida() {
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));
        when(ocorrenciaRepository.save(any(Ocorrencia.class))).thenReturn(ocorrenciaAberta);

        var resp = service.alterarStatus(1L,
                new AlterarStatusRequest(StatusOcorrencia.EM_ANDAMENTO), staff);

        assertThat(resp.status()).isEqualTo(StatusOcorrencia.EM_ANDAMENTO);
    }

    @Test
    @DisplayName("alterarStatus: RESOLVIDA preenche resolvidoEm")
    void resolver_preencheData() {
        ocorrenciaAberta.setStatus(StatusOcorrencia.EM_ANDAMENTO);
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));
        when(ocorrenciaRepository.save(any(Ocorrencia.class))).thenReturn(ocorrenciaAberta);

        var resp = service.alterarStatus(1L,
                new AlterarStatusRequest(StatusOcorrencia.RESOLVIDA), staff);

        assertThat(resp.status()).isEqualTo(StatusOcorrencia.RESOLVIDA);
        assertThat(resp.resolvidoEm()).isNotNull();
    }

    @Test
    @DisplayName("alterarStatus: transição inválida RESOLVIDA → ABERTA")
    void transicao_invalida() {
        ocorrenciaAberta.setStatus(StatusOcorrencia.RESOLVIDA);
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));

        assertThatThrownBy(() -> service.alterarStatus(1L,
                new AlterarStatusRequest(StatusOcorrencia.ABERTA), staff))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Transição inválida");
    }

    @Test
    @DisplayName("alterarStatus: morador só cancela a própria")
    void moradorCancelaPropria() {
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));
        when(ocorrenciaRepository.save(any(Ocorrencia.class))).thenReturn(ocorrenciaAberta);

        var resp = service.alterarStatus(1L,
                new AlterarStatusRequest(StatusOcorrencia.CANCELADA), autor);

        assertThat(resp.status()).isEqualTo(StatusOcorrencia.CANCELADA);
    }

    @Test
    @DisplayName("alterarStatus: morador não cancela de outro autor")
    void moradorNaoCancelaDeOutro() {
        Usuario outroMorador = Usuario.builder().id(99L).role(Role.MORADOR).build();
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));

        assertThatThrownBy(() -> service.alterarStatus(1L,
                new AlterarStatusRequest(StatusOcorrencia.CANCELADA), outroMorador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("abertas por você");
    }

    @Test
    @DisplayName("atribuirResponsavel: sucesso com zelador")
    void atribuir_sucesso() {
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(zelador));
        when(ocorrenciaRepository.save(any(Ocorrencia.class))).thenReturn(ocorrenciaAberta);

        var resp = service.atribuirResponsavel(1L, new AtribuirResponsavelRequest(5L));

        assertThat(resp.responsavelId()).isEqualTo(5L);
    }

    @Test
    @DisplayName("atribuirResponsavel: rejeita morador como responsável")
    void atribuir_roleInvalida() {
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));
        when(usuarioRepository.findById(99L)).thenReturn(Optional.of(
                Usuario.builder().id(99L).role(Role.MORADOR).build()));

        assertThatThrownBy(() -> service.atribuirResponsavel(1L, new AtribuirResponsavelRequest(99L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("síndico, zelador");
    }

    @Test
    @DisplayName("deletar: RESOLVIDA bloqueada (histórico)")
    void deletar_resolvida() {
        ocorrenciaAberta.setStatus(StatusOcorrencia.RESOLVIDA);
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));

        assertThatThrownBy(() -> service.deletar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("andamento ou resolvida");
    }

    @Test
    @DisplayName("deletar: CANCELADA permite")
    void deletar_cancelada() {
        ocorrenciaAberta.setStatus(StatusOcorrencia.CANCELADA);
        when(ocorrenciaRepository.findById(1L)).thenReturn(Optional.of(ocorrenciaAberta));

        service.deletar(1L);
        verify(ocorrenciaRepository).delete(ocorrenciaAberta);
    }
}