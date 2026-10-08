import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

const cards = [
  { key: 'comunicados', icon: 'bi-megaphone',      label: 'Comunicados', color: 'primary' },
  { key: 'reservas',    icon: 'bi-calendar-check', label: 'Reservas',    color: 'success' },
  { key: 'ocorrencias', icon: 'bi-tools',          label: 'Ocorrências', color: 'warning' },
  { key: 'lancamentos', icon: 'bi-cash-coin',      label: 'Lançamentos', color: 'info' },
];

export default function Dashboard() {
  usePageTitle('Dashboard — SindiPro', 'Painel de controle do condomínio.');
  const { user } = useAuth();
  const primeiroNome = user?.nome?.split(' ')[0] || 'usuário';

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 mb-1">Bem-vindo, {primeiroNome}</h1>
        <p className="text-secondary mb-0">Visão geral do condomínio</p>
      </div>

      <div className="row g-3 mb-4">
        {cards.map((c) => (
          <div key={c.key} className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-secondary small text-uppercase mb-1">
                      {c.label}
                    </p>
                    <p className="h3 mb-0">—</p>
                  </div>
                  <i
                    className={`bi ${c.icon} text-${c.color}`}
                    style={{ fontSize: '1.75rem' }}
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-info" role="alert">
        <i className="bi bi-info-circle me-2" aria-hidden="true"></i>
        Os dados serão exibidos aqui quando os endpoints de listagem forem
        implementados no back-end.
      </div>
    </>
  );
}