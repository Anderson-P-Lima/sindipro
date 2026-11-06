package com.sindipro.api.reserva;

import com.sindipro.api.area.AreaComum;
import com.sindipro.api.area.AreaComumRepository;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.reserva.dto.AlterarStatusReservaRequest;
import com.sindipro.api.reserva.dto.ReservaRequest;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import com.sindipro.api.unidade.Unidade;
import com.sindipro.api.unidade.UnidadeRepository;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReservaService")
class ReservaServiceTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Mock private ReservaRepository reservaRepository;
    @Mock private AreaComumRepository areaRepository;
    @Mock private UnidadeRepository unidadeRepository;
    @Mock private MoradorUnidadeRepository moradorUnidadeRepository;

    @InjectMocks private ReservaService reservaService;

    private AreaComum area;
    private Unidade unidade;
    private Usuario morador;
    private Instant inicio;
    private Instant fim;

    @BeforeEach
    void setup() {
        area = AreaComum.builder()
                .id(1L)
                .nome("Churrasqueira")
                .horarioIni(LocalTime.of(10, 0))
                .horarioFim(LocalTime.of(22, 0))
                .taxa(BigDecimal.valueOf(50))
                .ativo(true)
                .build();

        unidade = Unidade.builder().id(1L).numero("101").ativo(true).build();
        morador = Usuario.builder().id(3L).nome("Maria").role(Role.MORADOR).ativo(true).build();

        // 15/12/2026 18:00 - 21:00 BRT
        inicio = java.time.LocalDateTime.of(2026, 12, 15, 18, 0).atZone(SP).toInstant();
        fim    = java.time.LocalDateTime.of(2026, 12, 15, 21, 0).atZone(SP).toInstant();
    }

    private ReservaRequest req(Instant ini, Instant f) {
        return new ReservaRequest(1L, 1L, ini, f, "Obs");
    }

    // ---------- criar ----------

    @Test
    @DisplayName("criar: sucesso quando não há conflito")
    void criar_sucesso() {
        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));
        when(unidadeRepository.findById(1L)).thenReturn(Optional.of(unidade));
        when(moradorUnidadeRepository.findByUsuarioId(3L))
                .thenReturn(List.of(mockMoradorUnidade()));
        when(reservaRepository.findConflitos(1L, inicio, fim)).thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(inv -> {
            Reserva r = inv.getArgument(0);
            r.setId(10L);
            return r;
        });

        var resp = reservaService.criar(req(inicio, fim), morador);

        assertThat(resp.id()).isEqualTo(10L);
        assertThat(resp.status()).isEqualTo(StatusReserva.PENDENTE);
        verify(reservaRepository).save(any(Reserva.class));
    }

    @Test
    @DisplayName("criar: área inexistente → ResourceNotFoundException")
    void criar_areaInexistente() {
        when(areaRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservaService.criar(req(inicio, fim), morador))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Área comum não encontrada");
    }

    @Test
    @DisplayName("criar: área inativa → BusinessException")
    void criar_areaInativa() {
        area.setAtivo(false);
        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));

        assertThatThrownBy(() -> reservaService.criar(req(inicio, fim), morador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inativa");
    }

    @Test
    @DisplayName("criar: sobreposição de horário bloqueia")
    void criar_conflito() {
        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));
        when(unidadeRepository.findById(1L)).thenReturn(Optional.of(unidade));
        when(moradorUnidadeRepository.findByUsuarioId(3L))
                .thenReturn(List.of(mockMoradorUnidade()));
        when(reservaRepository.findConflitos(1L, inicio, fim))
                .thenReturn(List.of(new Reserva()));

        assertThatThrownBy(() -> reservaService.criar(req(inicio, fim), morador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe reserva");

        verify(reservaRepository, never()).save(any());
    }

    @Test
    @DisplayName("criar: início fora do horário da área")
    void criar_foraHorarioInicio() {
        // 09:00 BRT — antes do 10:00
        Instant ini9 = java.time.LocalDateTime.of(2026, 12, 15, 9, 0).atZone(SP).toInstant();
        Instant fim11 = java.time.LocalDateTime.of(2026, 12, 15, 11, 0).atZone(SP).toInstant();

        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));
        when(unidadeRepository.findById(1L)).thenReturn(Optional.of(unidade));
        when(moradorUnidadeRepository.findByUsuarioId(3L))
                .thenReturn(List.of(mockMoradorUnidade()));

        assertThatThrownBy(() -> reservaService.criar(req(ini9, fim11), morador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Início fora do horário");
    }

    @Test
    @DisplayName("criar: fim antes de início")
    void criar_periodoInvalido() {
        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));
        when(unidadeRepository.findById(1L)).thenReturn(Optional.of(unidade));
        when(moradorUnidadeRepository.findByUsuarioId(3L))
                .thenReturn(List.of(mockMoradorUnidade()));

        assertThatThrownBy(() -> reservaService.criar(req(fim, inicio), morador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("posterior");
    }

    @Test
    @DisplayName("criar: morador sem vínculo com a unidade é bloqueado")
    void criar_semVinculo() {
        when(areaRepository.findById(1L)).thenReturn(Optional.of(area));
        when(unidadeRepository.findById(1L)).thenReturn(Optional.of(unidade));
        when(moradorUnidadeRepository.findByUsuarioId(3L))
                .thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> reservaService.criar(req(inicio, fim), morador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("vínculo");
    }

    // ---------- alterar status ----------

    @Test
    @DisplayName("alterarStatus: PENDENTE → APROVADA permite síndico")
    void aprovar_pendente() {
        Reserva r = new Reserva();
        r.setId(1L);
        r.setStatus(StatusReserva.PENDENTE);
        r.setInicio(inicio);
        r.setFim(fim);
        r.setAreaComum(area);
        r.setUnidade(unidade);
        r.setSolicitante(morador);

        Usuario sindico = Usuario.builder().id(2L).role(Role.SINDICO).build();

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(r));
        when(reservaRepository.findConflitos(anyLong(), any(), any())).thenReturn(Collections.emptyList());
        when(reservaRepository.save(any(Reserva.class))).thenReturn(r);

        var resp = reservaService.alterarStatus(1L,
                new AlterarStatusReservaRequest(StatusReserva.APROVADA), sindico);

        assertThat(resp.status()).isEqualTo(StatusReserva.APROVADA);
    }

    @Test
    @DisplayName("alterarStatus: transição inválida (CONCLUIDA → APROVADA)")
    void transicaoInvalida() {
        Reserva r = new Reserva();
        r.setId(1L);
        r.setStatus(StatusReserva.CONCLUIDA);
        r.setSolicitante(morador);

        Usuario sindico = Usuario.builder().id(2L).role(Role.SINDICO).build();
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> reservaService.alterarStatus(1L,
                new AlterarStatusReservaRequest(StatusReserva.APROVADA), sindico))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Transição inválida");
    }

    @Test
    @DisplayName("alterarStatus: morador não pode aprovar")
    void moradorNaoAprova() {
        Reserva r = new Reserva();
        r.setId(1L);
        r.setStatus(StatusReserva.PENDENTE);
        r.setSolicitante(morador);

        when(reservaRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> reservaService.alterarStatus(1L,
                new AlterarStatusReservaRequest(StatusReserva.APROVADA), morador))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cancelar a própria");
    }

    // ---------- deletar ----------

    @Test
    @DisplayName("deletar: APROVADA bloqueia (histórico)")
    void deletar_aprovada() {
        Reserva r = new Reserva();
        r.setId(1L);
        r.setStatus(StatusReserva.APROVADA);
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> reservaService.deletar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("aprovada ou concluída");

        verify(reservaRepository, never()).delete(any(Reserva.class));
    }

    @Test
    @DisplayName("deletar: CANCELADA permite")
    void deletar_cancelada() {
        Reserva r = new Reserva();
        r.setId(1L);
        r.setStatus(StatusReserva.CANCELADA);
        when(reservaRepository.findById(1L)).thenReturn(Optional.of(r));

        reservaService.deletar(1L);
        verify(reservaRepository).delete(r);
    }

    // ---------- helper ----------

    private com.sindipro.api.moradorunidade.MoradorUnidade mockMoradorUnidade() {
        var mu = new com.sindipro.api.moradorunidade.MoradorUnidade();
        mu.setUnidade(unidade);
        return mu;
    }
}