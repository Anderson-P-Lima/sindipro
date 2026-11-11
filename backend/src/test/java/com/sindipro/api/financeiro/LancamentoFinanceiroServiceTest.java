package com.sindipro.api.financeiro;

import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.financeiro.dto.LancamentoRequest;
import com.sindipro.api.financeiro.dto.RegistrarPagamentoRequest;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.shared.exception.BusinessException;
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
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LancamentoFinanceiroService")
class LancamentoFinanceiroServiceTest {

    @Mock private LancamentoFinanceiroRepository repository;
    @Mock private UnidadeRepository unidadeRepository;
    @Mock private MoradorUnidadeRepository moradorUnidadeRepository;
    @Mock private CondominioService condominioService;

    @InjectMocks private LancamentoFinanceiroService service;

    private Condominio condominio;
    private Usuario sindico;

    @BeforeEach
    void setup() {
        condominio = Condominio.builder().id(1L).nome("Teste").build();
        sindico = Usuario.builder().id(2L).role(Role.SINDICO).build();
    }

    private LancamentoRequest reqDespesa() {
        return new LancamentoRequest(
                TipoLancamento.DESPESA, "MANUTENCAO", "Elevador",
                new BigDecimal("1200.00"), LocalDate.of(2026, 12, 5), null);
    }

    @Test
    @DisplayName("criar: lançamento começa como PENDENTE")
    void criar_sucesso() {
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.save(any(LancamentoFinanceiro.class))).thenAnswer(inv -> {
            LancamentoFinanceiro l = inv.getArgument(0);
            l.setId(10L);
            return l;
        });

        var resp = service.criar(reqDespesa(), sindico);

        assertThat(resp.id()).isEqualTo(10L);
        assertThat(resp.status()).isEqualTo(StatusLancamento.PENDENTE);
    }

    @Test
    @DisplayName("registrarPagamento: PENDENTE → PAGO preenche data")
    void pagar_pendente() {
        var l = LancamentoFinanceiro.builder()
                .id(1L)
                .status(StatusLancamento.PENDENTE)
                .condominio(condominio)
                .criadoPor(sindico)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(l));
        when(repository.save(any(LancamentoFinanceiro.class))).thenReturn(l);

        var resp = service.registrarPagamento(1L,
                new RegistrarPagamentoRequest(LocalDate.of(2026, 11, 1)));

        assertThat(resp.status()).isEqualTo(StatusLancamento.PAGO);
        assertThat(resp.dataPagamento()).isEqualTo(LocalDate.of(2026, 11, 1));
    }

    @Test
    @DisplayName("registrarPagamento: CANCELADO bloqueado")
    void pagar_cancelado() {
        var l = LancamentoFinanceiro.builder()
                .id(1L).status(StatusLancamento.CANCELADO).build();
        when(repository.findById(1L)).thenReturn(Optional.of(l));

        assertThatThrownBy(() -> service.registrarPagamento(1L,
                new RegistrarPagamentoRequest(LocalDate.now())))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDENTE ou ATRASADO");
    }

    @Test
    @DisplayName("cancelar: PENDENTE → CANCELADO")
    void cancelar_sucesso() {
        var l = LancamentoFinanceiro.builder()
                .id(1L)
                .status(StatusLancamento.PENDENTE)
                .condominio(condominio)
                .criadoPor(sindico)
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(l));
        when(repository.save(any(LancamentoFinanceiro.class))).thenReturn(l);

        var resp = service.cancelar(1L);

        assertThat(resp.status()).isEqualTo(StatusLancamento.CANCELADO);
    }

    @Test
    @DisplayName("cancelar: PAGO bloqueado")
    void cancelar_pago() {
        var l = LancamentoFinanceiro.builder()
                .id(1L).status(StatusLancamento.PAGO).build();
        when(repository.findById(1L)).thenReturn(Optional.of(l));

        assertThatThrownBy(() -> service.cancelar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDENTE ou ATRASADO");
    }

    @Test
    @DisplayName("atualizar: PAGO bloqueado")
    void atualizar_pago() {
        var l = LancamentoFinanceiro.builder()
                .id(1L).status(StatusLancamento.PAGO).build();
        when(repository.findById(1L)).thenReturn(Optional.of(l));

        assertThatThrownBy(() -> service.atualizar(1L, reqDespesa()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDENTE ou ATRASADO");
    }

    @Test
    @DisplayName("deletar: PAGO bloqueado")
    void deletar_pago() {
        var l = LancamentoFinanceiro.builder()
                .id(1L).status(StatusLancamento.PAGO).build();
        when(repository.findById(1L)).thenReturn(Optional.of(l));

        assertThatThrownBy(() -> service.deletar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("PENDENTE");

        verify(repository, never()).delete(any(LancamentoFinanceiro.class));
    }
}