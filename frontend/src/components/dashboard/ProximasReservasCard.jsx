import { Link } from 'react-router-dom';

function formatarPeriodo(inicio, fim) {
  const data = new Date(inicio).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
  });
  const hIni = new Date(inicio).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
  const hFim = new Date(fim).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${data} · ${hIni} – ${hFim}`;
}

export default function ProximasReservasCard({ reservas }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">
            <i className="bi bi-calendar-check text-success me-2" aria-hidden="true"></i>
            Próximas reservas
          </h2>
          <Link to="/reservas" className="small text-decoration-none">
            Ver todas <i className="bi bi-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>

        {reservas.length === 0 ? (
          <p className="text-secondary mb-0 text-center py-4">
            Nenhuma reserva aprovada futura.
          </p>
        ) : (
          <ul className="list-unstyled mb-0">
            {reservas.map((r) => (
              <li
                key={r.id}
                className="py-2 border-bottom last-no-border"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold">{r.areaComumNome}</div>
                    <div className="small text-secondary">
                      <i className="bi bi-clock me-1" aria-hidden="true"></i>
                      {formatarPeriodo(r.inicio, r.fim)}
                    </div>
                  </div>
                  <span className="badge bg-success align-self-start">Aprovada</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}