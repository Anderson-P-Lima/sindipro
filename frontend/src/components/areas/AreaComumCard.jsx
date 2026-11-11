function formatarHora(hora) {
  if (!hora) return '—';
  // Backend envia "10:00:00"; exibimos "10:00"
  return hora.slice(0, 5);
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function AreaComumCard({ area, onEditar, onExcluir, onToggleStatus }) {
  return (
    <article className="card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h2 className="h5 mb-0">{area.nome}</h2>
          {(onEditar || onExcluir) && (
            <div className="btn-group btn-group-sm" role="group" aria-label={`Ações de ${area.nome}`}>
              {onEditar && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-0"
                  onClick={() => onEditar(area)}
                  aria-label={`Editar ${area.nome}`}
                >
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                </button>
              )}
              {onExcluir && (
                <button
                  type="button"
                  className="btn btn-outline-danger border-0"
                  onClick={() => onExcluir(area)}
                  aria-label={`Excluir ${area.nome}`}
                >
                  <i className="bi bi-trash" aria-hidden="true"></i>
                </button>
              )}
            </div>
          )}
        </div>

        <span className={`badge bg-${area.ativo ? 'success' : 'secondary'} align-self-start mb-2`}>
          {area.ativo ? 'Ativa' : 'Inativa'}
        </span>

        {area.descricao && (
          <p className="text-secondary small mb-3" style={{ whiteSpace: 'pre-line' }}>
            {area.descricao}
          </p>
        )}

        <ul className="list-unstyled small text-secondary mb-3 flex-grow-1">
          <li className="mb-1">
            <i className="bi bi-clock me-2" aria-hidden="true"></i>
            {formatarHora(area.horarioIni)} – {formatarHora(area.horarioFim)}
          </li>
          {area.capacidade && (
            <li className="mb-1">
              <i className="bi bi-people me-2" aria-hidden="true"></i>
              Capacidade: {area.capacidade}
            </li>
          )}
          <li>
            <i className="bi bi-cash-coin me-2" aria-hidden="true"></i>
            Taxa: {formatarMoeda(area.taxa)}
          </li>
        </ul>

        {onToggleStatus && (
          <button
            type="button"
            className={`btn btn-sm btn-outline-${area.ativo ? 'secondary' : 'success'} w-100`}
            onClick={() => onToggleStatus(area)}
          >
            <i
              className={`bi ${area.ativo ? 'bi-pause-circle' : 'bi-play-circle'} me-1`}
              aria-hidden="true"
            ></i>
            {area.ativo ? 'Desativar' : 'Reativar'}
          </button>
        )}
      </div>
    </article>
  );
}