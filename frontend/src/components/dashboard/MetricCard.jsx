import { Link } from 'react-router-dom';

export default function MetricCard({ titulo, valor, subtitulo, icone, cor = 'primary', link }) {
  const conteudo = (
    <div className="card h-100 h-100-hover">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <p className="text-secondary small text-uppercase mb-0">{titulo}</p>
          <i
            className={`bi ${icone} text-${cor}`}
            style={{ fontSize: '1.5rem' }}
            aria-hidden="true"
          ></i>
        </div>
        <p className="h2 mb-0">{valor}</p>
        {subtitulo && (
          <p className="text-secondary small mb-0 mt-1">{subtitulo}</p>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        to={link}
        className="text-decoration-none text-reset d-block h-100"
        aria-label={`${titulo}: ${valor}. Ir para a página`}
      >
        {conteudo}
      </Link>
    );
  }
  return conteudo;
}