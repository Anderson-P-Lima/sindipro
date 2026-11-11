import { STATUS, PRIORIDADES } from '../../services/ocorrenciaService';

function formatarData(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OcorrenciaCard({
  ocorrencia,
  user,
  onChangeStatus,
  onAtribuir,
  onExcluir,
  onConfirmarExclusao,
}) {
  const st = STATUS[ocorrencia.status];
  const pr = PRIORIDADES[ocorrencia.prioridade];

  const isStaff = ['ADMIN_SISTEMA', 'SINDICO', 'ZELADOR'].includes(user?.role);
  const isAdmin = user?.role === 'ADMIN_SISTEMA';
  const isSindico = user?.role === 'SINDICO';
  const isMorador = user?.role === 'MORADOR';
  const isAutor = ocorrencia.autorId === user?.id;

  const pode = {
    iniciar:
      ocorrencia.status === 'ABERTA' && isStaff,
    resolver:
      ocorrencia.status === 'EM_ANDAMENTO' && isStaff,
    cancelar:
      ['ABERTA', 'EM_ANDAMENTO'].includes(ocorrencia.status) &&
      (isStaff || (isMorador && isAutor)),
    atribuir:
      ['ABERTA', 'EM_ANDAMENTO'].includes(ocorrencia.status) &&
      (isAdmin || isSindico),
    excluir:
      ['ABERTA', 'CANCELADA'].includes(ocorrencia.status) && isAdmin,
  };

  const temAcoes =
    pode.iniciar || pode.resolver || pode.cancelar || pode.atribuir || pode.excluir;

  return (
    <article className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex flex-wrap gap-1">
            <span className={`badge bg-${st.cor}`}>{st.rotulo}</span>
            <span className={`badge bg-${pr.cor}`}>{pr.rotulo}</span>
          </div>
          {pode.excluir && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger border-0"
              onClick={() => onConfirmarExclusao(ocorrencia)}
              aria-label={`Excluir ocorrência ${ocorrencia.titulo}`}
            >
              <i className="bi bi-trash" aria-hidden="true"></i>
            </button>
          )}
        </div>

        <h2 className="h5 mb-2">{ocorrencia.titulo}</h2>
        <p className="text-secondary mb-3" style={{ whiteSpace: 'pre-line' }}>
          {ocorrencia.descricao}
        </p>

        <ul className="list-unstyled small text-secondary mb-3">
          {ocorrencia.unidadeNumero && (
            <li className="mb-1">
              <i className="bi bi-house-door me-2" aria-hidden="true"></i>
              {ocorrencia.blocoNome ? `${ocorrencia.blocoNome} — ` : ''}
              Apto {ocorrencia.unidadeNumero}
            </li>
          )}
          <li className="mb-1">
            <i className="bi bi-person me-2" aria-hidden="true"></i>
            Aberta por {ocorrencia.autorNome}
          </li>
          {ocorrencia.responsavelNome && (
            <li className="mb-1">
              <i className="bi bi-person-check me-2" aria-hidden="true"></i>
              Responsável: {ocorrencia.responsavelNome}
            </li>
          )}
          <li className="mb-1">
            <i className="bi bi-calendar me-2" aria-hidden="true"></i>
            <time dateTime={ocorrencia.criadoEm}>
              {formatarData(ocorrencia.criadoEm)}
            </time>
          </li>
          {ocorrencia.resolvidoEm && (
            <li>
              <i className="bi bi-check-circle me-2" aria-hidden="true"></i>
              Resolvida em {formatarData(ocorrencia.resolvidoEm)}
            </li>
          )}
        </ul>

        {temAcoes && (
          <div className="d-flex flex-wrap gap-2 border-top pt-3">
            {pode.iniciar && (
              <button
                type="button"
                className="btn btn-sm btn-warning"
                onClick={() => onChangeStatus(ocorrencia, 'EM_ANDAMENTO')}
              >
                <i className="bi bi-play-fill me-1" aria-hidden="true"></i>
                Iniciar
              </button>
            )}
            {pode.resolver && (
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => onChangeStatus(ocorrencia, 'RESOLVIDA')}
              >
                <i className="bi bi-check-lg me-1" aria-hidden="true"></i>
                Resolver
              </button>
            )}
            {pode.atribuir && (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => onAtribuir(ocorrencia)}
              >
                <i className="bi bi-person-plus me-1" aria-hidden="true"></i>
                {ocorrencia.responsavelNome ? 'Trocar responsável' : 'Atribuir'}
              </button>
            )}
            {pode.cancelar && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onChangeStatus(ocorrencia, 'CANCELADA')}
              >
                <i className="bi bi-x-lg me-1" aria-hidden="true"></i>
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}