import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useReservas } from '../hooks/useReservas';
import { usePageTitle } from '../hooks/usePageTitle';
import { reservaService, STATUS_RESERVA } from '../services/reservaService';
import ReservaCard from '../components/reservas/ReservaCard';
import ReservaFormModal from '../components/reservas/ReservaFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export default function Reservas() {
  usePageTitle('Reservas — SindiPro', 'Reserva de áreas comuns do condomínio.');

  const { user } = useAuth();
  const { data, loading, erro, page, setPage, status, setStatus, recarregar } = useReservas();

  const [modalForm, setModalForm] = useState(false);
  const [confirmarStatus, setConfirmarStatus] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const criar = async (payload) => {
    await reservaService.criar(payload);
    await recarregar();
  };

  const alterarStatus = (reserva, novoStatus) => {
    // Cancelamentos e recusas pedem confirmação
    if (['CANCELADA', 'RECUSADA'].includes(novoStatus)) {
      setConfirmarStatus({ reserva, novoStatus });
      return;
    }
    executarStatus(reserva, novoStatus);
  };

  const executarStatus = async (reserva, novoStatus) => {
    try {
      await reservaService.alterarStatus(reserva.id, novoStatus);
      setConfirmarStatus(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível alterar o status.');
    }
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      await reservaService.deletar(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível excluir.');
    } finally {
      setExcluindo(false);
    }
  };

  const textoConfirmStatus = (() => {
    if (!confirmarStatus) return '';
    const { reserva, novoStatus } = confirmarStatus;
    if (novoStatus === 'CANCELADA') {
      return `Cancelar a reserva de "${reserva.areaComumNome}"?`;
    }
    if (novoStatus === 'RECUSADA') {
      return `Recusar a reserva de "${reserva.areaComumNome}"?`;
    }
    return '';
  })();

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Reservas</h1>
          <p className="text-secondary mb-0">
            {user?.role === 'MORADOR'
              ? 'Suas solicitações de reserva'
              : 'Todas as reservas do condomínio'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalForm(true)}
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Nova reserva
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label htmlFor="filtro-status" className="col-form-label small text-secondary">
                Status:
              </label>
            </div>
            <div className="col-md-4">
              <select
                id="filtro-status"
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(STATUS_RESERVA).map(([valor, info]) => (
                  <option key={valor} value={valor}>
                    {info.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="col text-md-end">
              <small className="text-secondary">
                {data.totalElements}{' '}
                {data.totalElements === 1 ? 'reserva' : 'reservas'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          {erro}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={recarregar}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5" role="status">
          <div className="spinner-border text-primary" aria-hidden="true"></div>
          <p className="text-secondary mt-2 mb-0">Carregando...</p>
        </div>
      ) : data.content.length === 0 ? (
        <EmptyState
          icone="bi-calendar-check"
          titulo="Nenhuma reserva encontrada"
          descricao={
            status
              ? 'Nenhum resultado para o filtro selecionado.'
              : user?.role === 'MORADOR'
              ? 'Você ainda não solicitou nenhuma reserva.'
              : 'Nenhuma reserva registrada no condomínio.'
          }
          acao={
            !status ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalForm(true)}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Solicitar reserva
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="row g-3">
            {data.content.map((r) => (
              <div key={r.id} className="col-12 col-md-6 col-xl-4">
                <ReservaCard
                  reserva={r}
                  user={user}
                  onChangeStatus={alterarStatus}
                  onConfirmarExclusao={(item) => setConfirmarExclusao(item)}
                />
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ReservaFormModal
        aberto={modalForm}
        onFechar={() => setModalForm(false)}
        onSalvar={criar}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarStatus)}
        titulo={
          confirmarStatus?.novoStatus === 'RECUSADA'
            ? 'Recusar reserva'
            : 'Cancelar reserva'
        }
        mensagem={textoConfirmStatus}
        textoConfirmar={confirmarStatus?.novoStatus === 'RECUSADA' ? 'Recusar' : 'Cancelar reserva'}
        corConfirmar={confirmarStatus?.novoStatus === 'RECUSADA' ? 'danger' : 'warning'}
        onConfirmar={() =>
          confirmarStatus &&
          executarStatus(confirmarStatus.reserva, confirmarStatus.novoStatus)
        }
        onCancelar={() => setConfirmarStatus(null)}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir reserva"
        mensagem={
          confirmarExclusao
            ? `Excluir permanentemente a reserva de "${confirmarExclusao.areaComumNome}"?`
            : ''
        }
        textoConfirmar="Excluir"
        corConfirmar="danger"
        carregando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setConfirmarExclusao(null)}
      />
    </>
  );
}