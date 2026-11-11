import { STATUS_RESERVA, formatarDataHora } from '../../services/reservaService';

export default function ReservaCard({ reserva, user, onChangeStatus, onConfirmarExclusao }) {
  const st = STATUS_RESERVA[reserva.status];

  const isStaff = ['ADMIN_SISTEMA', 'SINDICO'].includes(user?.role);
  const isMorador = user?.role === 'MORADOR';
  const isAdmin = user?.role === 'ADMIN_SISTEMA';
  const isSolicitante = reserva.solicitanteId === user?.id;

  const pode = {
    aprovar:   reserva.status === 'PENDENTE'  && isStaff,
    recusar:   reserva.status === 'PENDENTE'  && isStaff,
    concluir:  reserva.status === 'APROVADA'  && isStaff,
    cancelar:
      ['PENDENTE', 'APROVADA'].includes(reserva.status) &&
      (isStaff || (isMorador && isSolicitante)),
    excluir:   ['RECUSADA', 'CANCELADA'].includes(reserva.status) && isAdmin,
  };

  const temAcoes =
    pode.aprovar || pode.recusar || pode.concluir || pode.cancelar || pode.excluir;

  return (
    <article className="card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className={`badge bg-${st.cor}`}>{st.rotulo}</span>
          {pode.excluir && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger border-0"
              onClick={() => onConfirmarExclusao(reserva)}
              aria-label={`Excluir reserva ${reserva.areaComumNome}`}
            >
              <i className="bi bi-trash" aria-hidden="true"></i>
            </button>
          )}
        </div>

        <h2 className="h5 mb-2">{reserva.areaComumNome}</h2>

        <ul className="list-unstyled small text-secondary mb-3 flex-grow-1">
          <li className="mb-1">
            <i className="bi bi-calendar-event me-2" aria-hidden="true"></i>
            <time dateTime={reserva.inicio}>
              {formatarDataHora(reserva.inicio)}
            </time>{' '}
            –{' '}
            <time dateTime={reserva.fim}>
              {formatarDataHora(reserva.fim).split(' ')[1]}
            </time>
          </li>
          <li className="mb-1">
            <i className="bi bi-house-door me-2" aria-hidden="true"></i>
            {reserva.blocoNome ? `${reserva.blocoNome} — ` : ''}
            Apto {reserva.unidadeNumero}
          </li>
          <li className="mb-1">
            <i className="bi bi-person me-2" aria-hidden="true"></i>
            {reserva.solicitanteNome}
          </li>
          {reserva.observacao && (
            <li className="mt-2 text-body" style={{ whiteSpace: 'pre-line' }}>
              <i className="bi bi-chat-left-text me-2" aria-hidden="true"></i>
              {reserva.observacao}
            </li>
          )}
        </ul>

        {temAcoes && (
          <div className="d-flex flex-wrap gap-2 border-top pt-3">
            {pode.aprovar && (
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => onChangeStatus(reserva, 'APROVADA')}
              >
                <i className="bi bi-check-lg me-1" aria-hidden="true"></i>
                Aprovar
              </button>
            )}
            {pode.recusar && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => onChangeStatus(reserva, 'RECUSADA')}
              >
                <i className="bi bi-x-lg me-1" aria-hidden="true"></i>
                Recusar
              </button>
            )}
            {pode.concluir && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => onChangeStatus(reserva, 'CONCLUIDA')}
              >
                <i className="bi bi-check2-all me-1" aria-hidden="true"></i>
                Concluir
              </button>
            )}
            {pode.cancelar && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onChangeStatus(reserva, 'CANCELADA')}
              >
                <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}