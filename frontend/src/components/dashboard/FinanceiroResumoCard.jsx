import { formatarMoeda } from '../../services/dashboardService';

export default function FinanceiroResumoCard({ financeiro, isMorador }) {
  const { mesAtual, emAberto } = financeiro;
  const saldoPositivo = Number(mesAtual.saldo) >= 0;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">
            <i className="bi bi-cash-coin text-info me-2" aria-hidden="true"></i>
            Financeiro — mês atual
          </h2>
          <span className="badge bg-info-subtle text-info-emphasis">
            {isMorador ? 'Sua unidade' : 'Condomínio'}
          </span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="border rounded p-3 h-100">
              <p className="text-secondary small text-uppercase mb-1">Receitas pagas</p>
              <p className="h5 mb-0 text-success">
                {formatarMoeda(mesAtual.receitasPagas)}
              </p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded p-3 h-100">
              <p className="text-secondary small text-uppercase mb-1">Despesas pagas</p>
              <p className="h5 mb-0 text-danger">
                {formatarMoeda(mesAtual.despesasPagas)}
              </p>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="border rounded p-3 h-100">
              <p className="text-secondary small text-uppercase mb-1">Saldo do mês</p>
              <p className={`h5 mb-0 ${saldoPositivo ? 'text-success' : 'text-danger'}`}>
                {formatarMoeda(mesAtual.saldo)}
              </p>
            </div>
          </div>
        </div>

        {Number(emAberto.quantidade) > 0 && (
          <div className="alert alert-warning mt-3 mb-0 d-flex align-items-center" role="status">
            <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
            <div>
              <strong>{emAberto.quantidade}</strong>{' '}
              {emAberto.quantidade === 1 ? 'lançamento em aberto' : 'lançamentos em aberto'} —{' '}
              total de <strong>{formatarMoeda(emAberto.valor)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}