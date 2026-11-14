import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { usePageTitle } from '../hooks/usePageTitle';
import MetricCard from '../components/dashboard/MetricCard';
import OcorrenciasPorStatusCard from '../components/dashboard/OcorrenciasPorStatusCard';
import ProximasReservasCard from '../components/dashboard/ProximasReservasCard';
import FinanceiroResumoCard from '../components/dashboard/FinanceiroResumoCard';
import GraficoDespesas from '../components/dashboard/GraficoDespesas';
import GraficoEvolucao from '../components/dashboard/GraficoEvolucao';
import GraficoRankingAreas from '../components/dashboard/GraficoRankingAreas';

const subtituloPorRole = {
  ADMIN_SISTEMA: 'Visão global do condomínio',
  SINDICO: 'Visão global do condomínio',
  MORADOR: 'Visão das suas informações',
  PORTEIRO: 'Visão operacional',
  ZELADOR: 'Visão operacional',
};

export default function Dashboard() {
  usePageTitle('Dashboard — SindiPro', 'Painel de controle do condomínio.');

  const { user } = useAuth();
  const { data, loading, erro, atualizadoEm, recarregar } = useDashboard();
  const primeiroNome = user?.nome?.split(' ')[0] || 'usuário';
  const isMorador = user?.role === 'MORADOR';

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Bem-vindo, {primeiroNome}</h1>
          <p className="text-secondary mb-0">
            {subtituloPorRole[user?.role] || 'Painel de controle'}
          </p>
        </div>
        <div className="text-md-end">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={recarregar}
            disabled={loading}
            aria-label="Atualizar dashboard"
          >
            <i
              className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin-anim' : ''}`}
              aria-hidden="true"
            ></i>
            Atualizar
          </button>
          {atualizadoEm && (
            <div className="small text-secondary mt-1">
              Atualizado às{' '}
              {atualizadoEm.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          {erro}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={recarregar}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="text-center py-5" role="status">
          <div className="spinner-border text-primary" aria-hidden="true"></div>
          <p className="text-secondary mt-2 mb-0">Carregando painel...</p>
        </div>
      ) : data ? (
        <>
          {/* Linha 1 — métricas */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6 col-xl-3">
              <MetricCard
                titulo="Comunicados"
                valor={data.comunicados.total}
                subtitulo="Publicados"
                icone="bi-megaphone"
                cor="primary"
                link="/comunicados"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <MetricCard
                titulo="Ocorrências abertas"
                valor={data.ocorrencias.abertas + data.ocorrencias.emAndamento}
                subtitulo={`${data.ocorrencias.abertas} aberta(s) · ${data.ocorrencias.emAndamento} em andamento`}
                icone="bi-tools"
                cor="warning"
                link="/ocorrencias"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <MetricCard
                titulo="Reservas pendentes"
                valor={data.reservas.pendentes}
                subtitulo={`${data.reservas.aprovadas} aprovada(s)`}
                icone="bi-calendar-check"
                cor="success"
                link="/reservas"
              />
            </div>
            {data.financeiro && (
              <div className="col-12 col-sm-6 col-xl-3">
                <MetricCard
                  titulo="Em aberto"
                  valor={data.financeiro.emAberto.quantidade}
                  subtitulo={`Total: R$ ${Number(data.financeiro.emAberto.valor).toFixed(2)}`}
                  icone="bi-cash-coin"
                  cor={Number(data.financeiro.emAberto.valor) > 0 ? 'danger' : 'secondary'}
                  link="/financeiro"
                />
              </div>
            )}
          </div>

          {/* Linha 2 — detalhes operacionais e gráficos */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-4">
              <OcorrenciasPorStatusCard resumo={data.ocorrencias} />
            </div>
            {/* Só aparece se o back-end enviar os dados (evita moradores) */}
            {data.graficoDespesas && (
              <div className="col-12 col-lg-4">
                <GraficoDespesas dados={data.graficoDespesas} />
              </div>
            )}

            <div className="col-12 col-lg-4">
              <ProximasReservasCard reservas={data.reservas.proximas} />
            </div>
          </div>

          {/* Linha 2.5 — Evolução Financeira e Rnaking (Só Admin/Síndico) */}
          {(data.graficoEvolucao || data.graficoRankingAreas) && (
            <div className="row g-3 mb-3">
              {data.graficoEvolucao && (
                <div className="col-12 col-lg-7">
                  <GraficoEvolucao dados={data.graficoEvolucao} />
                </div>
              )}
              {data.graficoRankingAreas && (
                <div className="col-12 col-lg-5">
                  <GraficoRankingAreas dados={data.graficoRankingAreas} />
                </div>
              )}
            </div>
          )}

          {/* Linha 3 — financeiro (só se presente) */}
          {data.financeiro && (
            <div className="row g-3">
              <div className="col-12">
                <FinanceiroResumoCard
                  financeiro={data.financeiro}
                  isMorador={isMorador}
                />
              </div>
            </div>
          )}
        </>
      ) : null}
    </>
  );
}