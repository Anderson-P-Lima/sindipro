import { categoriaInfo } from '../../services/comunicadoService';

function formatarData(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ComunicadoCard({ comunicado, onEditar, onExcluir }) {
  const cat = categoriaInfo(comunicado.categoria);

  return (
    <article className="card h-100">
      {comunicado.fixado && (
        <div className="card-header bg-warning-subtle py-1 px-3 border-0">
          <small className="text-warning-emphasis fw-semibold">
            <i className="bi bi-pin-angle-fill me-1" aria-hidden="true"></i>
            Fixado
          </small>
        </div>
      )}
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className={`badge bg-${cat.cor}`}>{cat.rotulo}</span>
          {(onEditar || onExcluir) && (
            <div className="btn-group btn-group-sm" role="group" aria-label="Ações do comunicado">
              {onEditar && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-0"
                  onClick={() => onEditar(comunicado)}
                  aria-label={`Editar comunicado ${comunicado.titulo}`}
                >
                  <i className="bi bi-pencil" aria-hidden="true"></i>
                </button>
              )}
              {onExcluir && (
                <button
                  type="button"
                  className="btn btn-outline-danger border-0"
                  onClick={() => onExcluir(comunicado)}
                  aria-label={`Excluir comunicado ${comunicado.titulo}`}
                >
                  <i className="bi bi-trash" aria-hidden="true"></i>
                </button>
              )}
            </div>
          )}
        </div>

        <h2 className="h5 mb-2">{comunicado.titulo}</h2>
        <p className="text-secondary mb-3" style={{ whiteSpace: 'pre-line' }}>
          {comunicado.conteudo}
        </p>

        <div className="text-secondary small border-top pt-2">
          <div>
            <i className="bi bi-person-circle me-1" aria-hidden="true"></i>
            {comunicado.autorNome}
          </div>
          <div>
            <i className="bi bi-clock me-1" aria-hidden="true"></i>
            <time dateTime={comunicado.publicadoEm}>
              {formatarData(comunicado.publicadoEm)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}