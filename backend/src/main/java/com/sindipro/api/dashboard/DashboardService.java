package com.sindipro.api.dashboard;

import com.sindipro.api.comunicado.ComunicadoRepository;
import com.sindipro.api.condominio.Condominio;
import com.sindipro.api.condominio.CondominioService;
import com.sindipro.api.dashboard.dto.DashboardResponse;
import com.sindipro.api.dashboard.dto.GraficoCategoriaDTO;
import com.sindipro.api.dashboard.dto.GraficoEvolucaoDTO;
import com.sindipro.api.dashboard.dto.GraficoRankingDTO;
import com.sindipro.api.financeiro.LancamentoFinanceiro;
import com.sindipro.api.financeiro.LancamentoFinanceiroRepository;
import com.sindipro.api.financeiro.TipoLancamento;
import com.sindipro.api.moradorunidade.MoradorUnidade;
import com.sindipro.api.moradorunidade.MoradorUnidadeRepository;
import com.sindipro.api.ocorrencia.OcorrenciaRepository;
import com.sindipro.api.ocorrencia.StatusOcorrencia;
import com.sindipro.api.reserva.Reserva;
import com.sindipro.api.reserva.ReservaRepository;
import com.sindipro.api.reserva.StatusReserva;
import com.sindipro.api.usuario.Role;
import com.sindipro.api.usuario.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ComunicadoRepository comunicadoRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final ReservaRepository reservaRepository;
    private final LancamentoFinanceiroRepository lancamentoRepository;
    private final MoradorUnidadeRepository moradorUnidadeRepository;
    private final CondominioService condominioService;

    @Transactional(readOnly = true)
    public DashboardResponse resumo(Usuario user) {
        boolean isMorador = user.getRole() == Role.MORADOR;

        List<Long> unidadesDoMorador = isMorador
                ? moradorUnidadeRepository.findByUsuarioId(user.getId()).stream()
                .map(MoradorUnidade::getUnidade)
                .map(u -> u.getId())
                .toList()
                : List.of();

        // Dados específicos para Admin/Síndico
        List<GraficoCategoriaDTO> graficoDespesas = null;
        List<GraficoEvolucaoDTO> evolucao = null;
        List<GraficoRankingDTO> rankingAreas = null;

        if (!isMorador) {
            Condominio c = condominioService.obterAtual();
            graficoDespesas = lancamentoRepository.sumDespesasPorCategoria(c.getId());
            evolucao = gerarGraficoEvolucao(c.getId());
            rankingAreas = reservaRepository.sumReservasPorArea(c.getId());
        }

        return new DashboardResponse(
                comunicados(),
                ocorrencias(isMorador, user),
                reservas(isMorador, user),
                financeiro(user, unidadesDoMorador),
                graficoDespesas,
                evolucao,
                rankingAreas
        );
    }

    // ---------------- comunicados ----------------

    private DashboardResponse.ComunicadosResumo comunicados() {
        Condominio c = condominioService.obterAtual();
        Pageable umItem = PageRequest.of(0, 1);
        long total = comunicadoRepository
                .findByCondominioIdOrderByFixadoDescPublicadoEmDesc(c.getId(), umItem)
                .getTotalElements();
        return new DashboardResponse.ComunicadosResumo(total);
    }

    // ---------------- ocorrências ----------------

    private DashboardResponse.OcorrenciasResumo ocorrencias(boolean isMorador, Usuario user) {
        long abertas, emAndamento, resolvidas, canceladas;

        if (isMorador) {
            abertas      = ocorrenciaRepository.countByAutorIdAndStatus(user.getId(), StatusOcorrencia.ABERTA);
            emAndamento  = ocorrenciaRepository.countByAutorIdAndStatus(user.getId(), StatusOcorrencia.EM_ANDAMENTO);
            resolvidas   = ocorrenciaRepository.countByAutorIdAndStatus(user.getId(), StatusOcorrencia.RESOLVIDA);
            canceladas   = ocorrenciaRepository.countByAutorIdAndStatus(user.getId(), StatusOcorrencia.CANCELADA);
        } else {
            abertas      = ocorrenciaRepository.countByStatus(StatusOcorrencia.ABERTA);
            emAndamento  = ocorrenciaRepository.countByStatus(StatusOcorrencia.EM_ANDAMENTO);
            resolvidas   = ocorrenciaRepository.countByStatus(StatusOcorrencia.RESOLVIDA);
            canceladas   = ocorrenciaRepository.countByStatus(StatusOcorrencia.CANCELADA);
        }

        return new DashboardResponse.OcorrenciasResumo(
                abertas, emAndamento, resolvidas, canceladas,
                abertas + emAndamento + resolvidas + canceladas
        );
    }

    // ---------------- reservas ----------------

    private DashboardResponse.ReservasResumo reservas(boolean isMorador, Usuario user) {
        Instant agora = Instant.now();
        Pageable top5 = PageRequest.of(0, 5);
        List<Reserva> proximas;
        long pendentes, aprovadas;

        if (isMorador) {
            pendentes = reservaRepository.countByStatusAndSolicitanteId(
                    StatusReserva.PENDENTE, user.getId());
            aprovadas = reservaRepository.countByStatusAndSolicitanteId(
                    StatusReserva.APROVADA, user.getId());
            proximas  = reservaRepository.findProximasAprovadasBySolicitante(agora, user.getId(), top5);
        } else {
            pendentes = reservaRepository.countByStatus(StatusReserva.PENDENTE);
            aprovadas = reservaRepository.countByStatus(StatusReserva.APROVADA);
            proximas  = reservaRepository.findProximasAprovadas(agora, top5);
        }

        List<DashboardResponse.ReservaResumo> proximasResumo = proximas.stream()
                .map(r -> new DashboardResponse.ReservaResumo(
                        r.getId(),
                        r.getAreaComum().getNome(),
                        r.getInicio(),
                        r.getFim(),
                        r.getStatus().name()))
                .toList();

        return new DashboardResponse.ReservasResumo(pendentes, aprovadas, proximasResumo);
    }

    // ---------------- financeiro ----------------

    private DashboardResponse.FinanceiroResumo financeiro(Usuario user, List<Long> unidadesDoMorador) {
        Role role = user.getRole();

        if (role == Role.PORTEIRO || role == Role.ZELADOR) {
            return null;
        }

        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(hoje.lengthOfMonth());

        BigDecimal receitas, despesas, emAberto;
        long qtdEmAberto;

        if (role == Role.MORADOR) {
            if (unidadesDoMorador.isEmpty()) {
                receitas = BigDecimal.ZERO;
                despesas = BigDecimal.ZERO;
                emAberto = BigDecimal.ZERO;
                qtdEmAberto = 0;
            } else {
                receitas = lancamentoRepository.somarPagoPorTipoEPeriodoPorUnidades(
                        unidadesDoMorador, TipoLancamento.RECEITA, inicioMes, fimMes);
                despesas = lancamentoRepository.somarPagoPorTipoEPeriodoPorUnidades(
                        unidadesDoMorador, TipoLancamento.DESPESA, inicioMes, fimMes);
                emAberto = lancamentoRepository.somarEmAbertoPorUnidades(unidadesDoMorador);
                qtdEmAberto = lancamentoRepository.countEmAbertoPorUnidades(unidadesDoMorador);
            }
        } else {
            Condominio c = condominioService.obterAtual();
            receitas = lancamentoRepository.somarPagoPorTipoEPeriodo(
                    c.getId(), TipoLancamento.RECEITA, inicioMes, fimMes);
            despesas = lancamentoRepository.somarPagoPorTipoEPeriodo(
                    c.getId(), TipoLancamento.DESPESA, inicioMes, fimMes);
            emAberto = lancamentoRepository.somarTotalEmAberto(c.getId());
            qtdEmAberto = lancamentoRepository.countEmAberto(c.getId());
        }

        BigDecimal saldo = receitas.subtract(despesas);
        return new DashboardResponse.FinanceiroResumo(
                new DashboardResponse.MesAtual(receitas, despesas, saldo),
                new DashboardResponse.EmAberto(qtdEmAberto, emAberto)
        );
    }

    // ---------------- gráficos ----------------

    private List<GraficoEvolucaoDTO> gerarGraficoEvolucao(Long condId) {
        LocalDate hoje = LocalDate.now();
        LocalDate inicio = hoje.minusMonths(5).withDayOfMonth(1);

        var pagos = lancamentoRepository.findPagosAPartirDe(condId, inicio);

        var porMes = pagos.stream()
                .filter(l -> l.getDataPagamento() != null)
                .collect(Collectors.groupingBy(l -> YearMonth.from(l.getDataPagamento())));

        var resultado = new ArrayList<GraficoEvolucaoDTO>();
        var fmt = DateTimeFormatter.ofPattern("MMM/yy", new Locale("pt", "BR"));

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(hoje).minusMonths(i);
            var lancesDoMes = porMes.getOrDefault(ym, Collections.emptyList());

            var rec = lancesDoMes.stream().filter(l -> l.getTipo() == TipoLancamento.RECEITA)
                    .map(LancamentoFinanceiro::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
            var des = lancesDoMes.stream().filter(l -> l.getTipo() == TipoLancamento.DESPESA)
                    .map(LancamentoFinanceiro::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

            String labelMes = ym.format(fmt);
            labelMes = labelMes.substring(0, 1).toUpperCase() + labelMes.substring(1);

            resultado.add(new GraficoEvolucaoDTO(labelMes, rec, des));
        }
        return resultado;
    }
}