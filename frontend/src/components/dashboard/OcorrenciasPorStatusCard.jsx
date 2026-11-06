import { Link } from 'react-router-dom';

const linhas = [
  { key: 'abertas',     rotulo: 'Abertas',      cor: 'primary'   },
  { key: 'emAndamento', rotulo: 'Em andamento', cor: 'warning'   },
  { key: 'resolvidas',  rotulo: 'Resolvidas',   cor: 'success'   },
  { key: 'canceladas',  rotulo: 'Canceladas',   cor: 'secondary' },
];

export default function OcorrenciasPorStatusCard({ resumo }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">
            <i className="bi bi-tools text-warning me-2" aria-hidden="true"></i>
            Ocorrências
          </h2>
          <Link to="/ocorrencias" className="small text-decoration-none">
            Ver todas <i className="bi bi-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>

        <ul className="list-unstyled mb-0">
          {linhas.map((l) => (
            <li
              key={l.key}
              className="d-flex justify-content-between align-items-center py-2 border-bottom last-no-border"
            >
              <span>
                <span className={`badge bg-${l.cor} me-2`} aria-hidden="true"></span>
                {l.rotulo}
              </span>
              <strong className="h6 mb-0">{resumo[l.key] ?? 0}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}