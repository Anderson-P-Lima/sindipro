package com.sindipro.api.area;

import com.sindipro.api.area.dto.AreaComumRequest;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.reserva.ReservaRepository;
import com.sindipro.api.shared.exception.BusinessException;
import com.sindipro.api.shared.exception.ResourceConflictException;
import com.sindipro.api.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AreaComumService")
class AreaComumServiceTest {

    @Mock private AreaComumRepository repository;
    @Mock private ReservaRepository reservaRepository;
    @Mock private CondominioService condominioService;

    @InjectMocks private AreaComumService service;

    private Condominio condominio;
    private AreaComum area;

    @BeforeEach
    void setup() {
        condominio = Condominio.builder().id(1L).nome("Condomínio").build();
        area = AreaComum.builder()
                .id(1L).condominio(condominio).nome("Churrasqueira")
                .horarioIni(LocalTime.of(10, 0))
                .horarioFim(LocalTime.of(22, 0))
                .taxa(BigDecimal.ZERO).ativo(true)
                .build();
    }

    private AreaComumRequest reqValido() {
        return new AreaComumRequest("Churrasqueira", "desc", 20,
                LocalTime.of(10, 0), LocalTime.of(22, 0), BigDecimal.ZERO);
    }

    @Test
    @DisplayName("listar: filtra por ativo")
    void listar() {
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.findByCondominioId(1L)).thenReturn(List.of(area));

        var resp = service.listar(true);
        assertThat(resp).hasSize(1);
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
        when(repository.existsByCondominioIdAndNomeIgnoreCaseAndAtivoTrue(1L, "Churrasqueira"))
                .thenReturn(false);
        when(repository.save(any(AreaComum.class))).thenReturn(area);

        var resp = service.criar(reqValido());
        assertThat(resp.nome()).isEqualTo("Churrasqueira");
    }

    @Test
    @DisplayName("criar: nome duplicado")
    void criar_duplicado() {
        when(condominioService.obterAtual()).thenReturn(condominio);
        when(repository.existsByCondominioIdAndNomeIgnoreCaseAndAtivoTrue(1L, "Churrasqueira"))
                .thenReturn(true);

        assertThatThrownBy(() -> service.criar(reqValido()))
                .isInstanceOf(ResourceConflictException.class);
    }

    @Test
    @DisplayName("criar: horário inválido (fim antes de início)")
    void criar_horarioInvalido() {
        var req = new AreaComumRequest("Salão", null, null,
                LocalTime.of(22, 0), LocalTime.of(10, 0), BigDecimal.ZERO);

        assertThatThrownBy(() -> service.criar(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("posterior");
    }

    @Test
    @DisplayName("atualizar: nome inalterado dispensa checagem de duplicidade")
    void atualizar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(area));
        when(repository.save(any(AreaComum.class))).thenReturn(area);

        var resp = service.atualizar(1L, reqValido());
        assertThat(resp.nome()).isEqualTo("Churrasqueira");
        verify(repository, never())
                .existsByCondominioIdAndNomeIgnoreCaseAndAtivoTrue(anyLong(), anyString());
    }

    @Test
    @DisplayName("deletar: bloqueia se tem reservas ativas")
    void deletar_comReservas() {
        when(repository.findById(1L)).thenReturn(Optional.of(area));
        when(reservaRepository.existsReservaAtivaPorArea(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.deletar(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("reservas");
    }

    @Test
    @DisplayName("deletar: soft delete quando não há reservas")
    void deletar_sucesso() {
        when(repository.findById(1L)).thenReturn(Optional.of(area));
        when(reservaRepository.existsReservaAtivaPorArea(1L)).thenReturn(false);
        when(repository.save(any(AreaComum.class))).thenReturn(area);

        service.deletar(1L);

        assertThat(area.getAtivo()).isFalse();
        verify(repository).save(area);
    }

    @Test
    @DisplayName("alterarStatus: desativa")
    void alterarStatus() {
        when(repository.findById(1L)).thenReturn(Optional.of(area));
        when(repository.save(any(AreaComum.class))).thenReturn(area);

        var resp = service.alterarStatus(1L, false);
        assertThat(resp.ativo()).isFalse();
    }
}