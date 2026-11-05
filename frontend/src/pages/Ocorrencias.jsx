import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOcorrencias } from '../hooks/useOcorrencias';
import { usePageTitle } from '../hooks/usePageTitle';
import { ocorrenciaService, STATUS, PRIORIDADES } from '../services/ocorrenciaService';
import OcorrenciaCard from '../components/ocorrencias/OcorrenciaCard';
import OcorrenciaFormModal from '../components/ocorrencias/OcorrenciaFormModal';
import AtribuirResponsavelModal from '../components/ocorrencias/AtribuirResponsavelModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export default function Ocorrencias() {
  usePageTitle('Ocorrências — SindiPro', 'Registro e acompanhamento de ocorrências.');

  const { user } = useAuth();
  const {
    data,
    loading,
    erro,
    page,
    setPage,
    status,
    setStatus,
    prioridade,
    setPrioridade,
    recarregar,
  } = useOcorrencias();

  const [modalForm, setModalForm] = useState(false);
  const [atribuindo, setAtribuindo] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const criar = async (dados) => {
    await ocorrenciaService.criar(dados);
    await recarregar();
  };

  const alterarStatusDireto = async (ocorrencia, novoStatus) => {
    if (novoStatus === 'CANCELADA') {
      setConfirmarCancelamento(ocorrencia);
      return;
    }
    try {
      await ocorrenciaService.alterarStatus(ocorrencia.id, novoStatus);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível alterar o status.');
    }
  };

  const confirmarCancelamentoAgora = async () => {
    try {
      await ocorrenciaService.alterarStatus(confirmarCancelamento.id, 'CANCELADA');
      setConfirmarCancelamento(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível cancelar.');
    }
  };

  const atribuir = async (id, responsavelId) => {
    await ocorrenciaService.atribuirResponsavel(id, responsavelId);
    await recarregar();
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      await ocorrenciaService.deletar(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível excluir.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Ocorrências</h1>
          <p className="text-secondary mb-0">
            {user?.role === 'MORADOR'
              ? 'Suas ocorrências registradas'
              : 'Todas as ocorrências do condomínio'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalForm(true)}
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Nova ocorrência
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
            <div className="col-md-3">
              <select
                id="filtro-status"
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(STATUS).map(([valor, info]) => (
                  <option key={valor} value={valor}>
                    {info.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <label htmlFor="filtro-prioridade" className="col-form-label small text-secondary">
                Prioridade:
              </label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-prioridade"
                className="form-select form-select-sm"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
              >
                <option value="">Todas</option>
                {Object.entries(PRIORIDADES).map(([valor, info]) => (
                  <option key={valor} value={valor}>
                    {info.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="col text-md-end">
              <small className="text-secondary">
                {data.totalElements}{' '}
                {data.totalElements === 1 ? 'ocorrência' : 'ocorrências'}
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
          icone="bi-tools"
          titulo="Nenhuma ocorrência encontrada"
          descricao={
            status || prioridade
              ? 'Nenhum resultado para os filtros selecionados.'
              : user?.role === 'MORADOR'
              ? 'Você ainda não registrou nenhuma ocorrência.'
              : 'Nenhuma ocorrência registrada no condomínio.'
          }
          acao={
            !status && !prioridade ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalForm(true)}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Registrar primeira ocorrência
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="row g-3">
            {data.content.map((o) => (
              <div key={o.id} className="col-12 col-md-6 col-xl-4">
                <OcorrenciaCard
                  ocorrencia={o}
                  user={user}
                  onChangeStatus={alterarStatusDireto}
                  onAtribuir={(item) => setAtribuindo(item)}
                  onConfirmarExclusao={(item) => setConfirmarExclusao(item)}
                />
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <OcorrenciaFormModal
        aberto={modalForm}
        onFechar={() => setModalForm(false)}
        onSalvar={criar}
      />

      <AtribuirResponsavelModal
        aberto={Boolean(atribuindo)}
        ocorrencia={atribuindo}
        onFechar={() => setAtribuindo(null)}
        onConfirmar={atribuir}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarCancelamento)}
        titulo="Cancelar ocorrência"
        mensagem={
          confirmarCancelamento
            ? `Tem certeza que deseja cancelar "${confirmarCancelamento.titulo}"?`
            : ''
        }
        textoConfirmar="Cancelar ocorrência"
        corConfirmar="warning"
        onConfirmar={confirmarCancelamentoAgora}
        onCancelar={() => setConfirmarCancelamento(null)}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir ocorrência"
        mensagem={
          confirmarExclusao
            ? `Excluir permanentemente "${confirmarExclusao.titulo}"? Esta ação não pode ser desfeita.`
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