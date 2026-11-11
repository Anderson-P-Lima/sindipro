export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const paginas = Array.from({ length: totalPages }, (_, i) => i);
  const mostrar = paginas.filter((p) =>
    p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1
  );

  return (
    <nav aria-label="Paginação de comunicados" className="mt-4">
      <ul className="pagination justify-content-center mb-0">
        <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onChange(page - 1)}
            disabled={page === 0}
            aria-label="Página anterior"
          >
            <i className="bi bi-chevron-left" aria-hidden="true"></i>
          </button>
        </li>

        {mostrar.map((p, idx) => {
          const anterior = mostrar[idx - 1];
          const temGap = anterior !== undefined && p - anterior > 1;
          return (
            <span key={p} className="d-flex">
              {temGap && (
                <li className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              )}
              <li className={`page-item ${p === page ? 'active' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => onChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p + 1}
                </button>
              </li>
            </span>
          );
        })}

        <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Próxima página"
          >
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
}