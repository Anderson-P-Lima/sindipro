package com.sindipro.api.dashboard;

import com.sindipro.api.comunicado.Comunicado;
import com.sindipro.api.comunicado.ComunicadoRepository;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.financeiro.LancamentoFinanceiroRepository;
import com.sindipro.api.financeiro.TipoLancamento;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.ocorrencia.OcorrenciaRepository;
import com.sindipro.api.ocorrencia.StatusOcorrencia;
import com.sindipro.api.reserva.ReservaRepository;
import com.sindipro.api.reserva.StatusReserva;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock private ComunicadoRepository comunicadoRepository;
    @Mock private OcorrenciaRepository ocorrenciaRepository;
    @Mock private ReservaRepository reservaRepository;
    @Mock private LancamentoFinanceiroRepository lancamentoRepository;
    @Mock private MoradorUnidadeRepository moradorUnidadeRepository;
    @Mock private CondominioService condominioService;

    @InjectMocks private DashboardService service;

    private Condominio condominio;

    @BeforeEach
    void setup() {
        condominio = Condominio.builder().id(1L).build();
    }

    // ---------- síndico (visão global) ----------

    @Test
    @DisplayName("resumo: síndico vê dados globais + financeiro")
    void resumo_sindico() {
        Usuario sindico = Usuario.builder().id(2L).role(Role.SINDICO).build();

        when(condominioService.obterAtual()).thenReturn(condominio);
        when(comunicadoRepository.findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
                anyLong(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new Comunicado())));

        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.ABERTA)).thenReturn(3L);
        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.EM_ANDAMENTO)).thenReturn(2L);
        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.RESOLVIDA)).thenReturn(10L);
        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.CANCELADA)).thenReturn(1L);

        when(reservaRepository.countByStatus(StatusReserva.PENDENTE)).thenReturn(2L);
        when(reservaRepository.countByStatus(StatusReserva.APROVADA)).thenReturn(3L);
        when(reservaRepository.findProximasAprovadas(any(), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        when(lancamentoRepository.somarPagoPorTipoEPeriodo(anyLong(), eq(TipoLancamento.RECEITA), any(), any()))
                .thenReturn(new BigDecimal("1000.00"));
        when(lancamentoRepository.somarPagoPorTipoEPeriodo(anyLong(), eq(TipoLancamento.DESPESA), any(), any()))
                .thenReturn(new BigDecimal("800.00"));
        when(lancamentoRepository.somarTotalEmAberto(anyLong())).thenReturn(new BigDecimal("500.00"));
        when(lancamentoRepository.countEmAberto(anyLong())).thenReturn(2L);

        var resp = service.resumo(sindico);

        assertThat(resp.comunicados().total()).isEqualTo(1);
        assertThat(resp.ocorrencias().abertas()).isEqualTo(3);
        assertThat(resp.ocorrencias().total()).isEqualTo(16);
        assertThat(resp.reservas().pendentes()).isEqualTo(2);
        assertThat(resp.financeiro()).isNotNull();
        assertThat(resp.financeiro().mesAtual().saldo())
                .isEqualByComparingTo(new BigDecimal("200.00"));
        assertThat(resp.financeiro().emAberto().quantidade()).isEqualTo(2);
    }

    // ---------- morador (visão pessoal) ----------

    @Test
    @DisplayName("resumo: morador vê só os próprios dados")
    void resumo_morador() {
        Usuario morador = Usuario.builder().id(3L).role(Role.MORADOR).build();

        when(condominioService.obterAtual()).thenReturn(condominio);
        when(comunicadoRepository.findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
                anyLong(), any(Pageable.class)))
                .thenReturn(Page.empty());

        when(ocorrenciaRepository.countByAutorIdAndStatus(3L, StatusOcorrencia.ABERTA)).thenReturn(1L);
        when(ocorrenciaRepository.countByAutorIdAndStatus(3L, StatusOcorrencia.EM_ANDAMENTO)).thenReturn(0L);
        when(ocorrenciaRepository.countByAutorIdAndStatus(3L, StatusOcorrencia.RESOLVIDA)).thenReturn(2L);
        when(ocorrenciaRepository.countByAutorIdAndStatus(3L, StatusOcorrencia.CANCELADA)).thenReturn(0L);

        when(reservaRepository.countByStatusAndSolicitanteId(StatusReserva.PENDENTE, 3L)).thenReturn(1L);
        when(reservaRepository.countByStatusAndSolicitanteId(StatusReserva.APROVADA, 3L)).thenReturn(0L);
        when(reservaRepository.findProximasAprovadasBySolicitante(any(), eq(3L), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        // morador sem unidade vinculada → financeiro zero
        when(moradorUnidadeRepository.findByUsuarioId(3L)).thenReturn(Collections.emptyList());

        var resp = service.resumo(morador);

        assertThat(resp.ocorrencias().abertas()).isEqualTo(1);
        assertThat(resp.ocorrencias().resolvidas()).isEqualTo(2);
        assertThat(resp.reservas().pendentes()).isEqualTo(1);
        assertThat(resp.financeiro().mesAtual().receitasPagas())
                .isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.financeiro().emAberto().quantidade()).isZero();
    }

    // ---------- zelador (sem financeiro) ----------

    @Test
    @DisplayName("resumo: zelador NÃO tem campo financeiro")
    void resumo_zelador_semFinanceiro() {
        Usuario zelador = Usuario.builder().id(5L).role(Role.ZELADOR).build();

        when(condominioService.obterAtual()).thenReturn(condominio);
        when(comunicadoRepository.findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
                anyLong(), any(Pageable.class)))
                .thenReturn(Page.empty());

        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.ABERTA)).thenReturn(1L);
        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.EM_ANDAMENTO)).thenReturn(0L);
        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.RESOLVIDA)).thenReturn(0L);
        when(ocorrenciaRepository.countByStatus(StatusOcorrencia.CANCELADA)).thenReturn(0L);

        when(reservaRepository.countByStatus(StatusReserva.PENDENTE)).thenReturn(0L);
        when(reservaRepository.countByStatus(StatusReserva.APROVADA)).thenReturn(0L);
        when(reservaRepository.findProximasAprovadas(any(), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        var resp = service.resumo(zelador);

        assertThat(resp.financeiro()).isNull();
        // Não consultou lançamentos
        verify(lancamentoRepository, never()).somarTotalEmAberto(anyLong());
    }

    // ---------- porteiro ----------

    @Test
    @DisplayName("resumo: porteiro também sem financeiro")
    void resumo_porteiro_semFinanceiro() {
        Usuario porteiro = Usuario.builder().id(4L).role(Role.PORTEIRO).build();

        when(condominioService.obterAtual()).thenReturn(condominio);
        when(comunicadoRepository.findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
                anyLong(), any(Pageable.class))).thenReturn(Page.empty());
        when(ocorrenciaRepository.countByStatus(any())).thenReturn(0L);
        when(reservaRepository.countByStatus(any())).thenReturn(0L);
        when(reservaRepository.findProximasAprovadas(any(), any(Pageable.class)))
                .thenReturn(Collections.emptyList());

        var resp = service.resumo(porteiro);

        assertThat(resp.financeiro()).isNull();
    }

    // ---------- admin (visão global) ----------

    @Test
    @DisplayName("resumo: admin vê dados globais")
    void resumo_admin() {
        Usuario admin = Usuario.builder().id(1L).role(Role.ADMIN_SISTEMA).build();

        when(condominioService.obterAtual()).thenReturn(condominio);
        when(comunicadoRepository.findByCondominioIdOrderByFixadoDescPublicadoEmDesc(
                anyLong(), any(Pageable.class))).thenReturn(Page.empty());
        when(ocorrenciaRepository.countByStatus(any())).thenReturn(0L);
        when(reservaRepository.countByStatus(any())).thenReturn(0L);
        when(reservaRepository.findProximasAprovadas(any(), any(Pageable.class)))
                .thenReturn(Collections.emptyList());
        when(lancamentoRepository.somarPagoPorTipoEPeriodo(anyLong(), any(), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(lancamentoRepository.somarTotalEmAberto(anyLong())).thenReturn(BigDecimal.ZERO);
        when(lancamentoRepository.countEmAberto(anyLong())).thenReturn(0L);

        var resp = service.resumo(admin);

        assertThat(resp.financeiro()).isNotNull();
    }
}