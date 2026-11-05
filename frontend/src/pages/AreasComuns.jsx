import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAreasComuns } from '../hooks/useAreasComuns';
import { usePageTitle } from '../hooks/usePageTitle';
import { areaComumService } from '../services/areaComumService';
import AreaComumCard from '../components/areas/AreaComumCard';
import AreaComumFormModal from '../components/areas/AreaComumFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';

export default function AreasComuns() {
  usePageTitle('Áreas Comuns — SindiPro', 'Gestão das áreas comuns do condomínio.');

  const { user } = useAuth();
  const podeGerenciar = user?.role === 'ADMIN_SISTEMA' || user?.role === 'SINDICO';

  const { areas, loading, erro, filtroAtivo, setFiltroAtivo, recarregar } = useAreasComuns();

  const [modalForm, setModalForm] = useState({ aberto: false, area: null });
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [togglando, setTogglando] = useState(null);

  const salvar = async (dados) => {
    if (modalForm.area) {
      await areaComumService.atualizar(modalForm.area.id, dados);
    } else {
      await areaComumService.criar(dados);
    }
    await recarregar();
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      await areaComumService.deletar(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await recarregar();
    } finally {
      setExcluindo(false);
    }
  };

  const toggleStatus = async (area) => {
    setTogglando(area.id);
    try {
      await areaComumService.alterarStatus(area.id, !area.ativo);
      await recarregar();
    } catch (err) {
      alert(err.response?.data?.message || 'Não foi possível alterar o status.');
    } finally {
      setTogglando(null);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Áreas Comuns</h1>
          <p className="text-secondary mb-0">Espaços disponíveis para reserva</p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalForm({ aberto: true, area: null })}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Nova área
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label htmlFor="filtro-status" className="col-form-label small text-secondary">
                Mostrar:
              </label>
            </div>
            <div className="col-md-4">
              <select
                id="filtro-status"
                className="form-select form-select-sm"
                value={String(filtroAtivo)}
                onChange={(e) => setFiltroAtivo(e.target.value === 'true')}
              >
                <option value="true">Apenas ativas</option>
                <option value="false">Apenas inativas</option>
              </select>
            </div>
            <div className="col text-md-end">
              <small className="text-secondary">
                {areas.length} {areas.length === 1 ? 'área' : 'áreas'}
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
      ) : areas.length === 0 ? (
        <EmptyState
          icone="bi-door-open"
          titulo={filtroAtivo ? 'Nenhuma área ativa' : 'Nenhuma área inativa'}
          descricao={
            podeGerenciar
              ? 'Cadastre uma área comum para começar a receber reservas.'
              : 'O síndico ainda não cadastrou áreas comuns.'
          }
          acao={
            podeGerenciar && filtroAtivo ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalForm({ aberto: true, area: null })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Cadastrar área
              </button>
            ) : null
          }
        />
      ) : (
        <div className="row g-3">
          {areas.map((a) => (
            <div key={a.id} className="col-12 col-md-6 col-xl-4">
              <AreaComumCard
                area={a}
                onEditar={
                  podeGerenciar
                    ? (item) => setModalForm({ aberto: true, area: item })
                    : undefined
                }
                onExcluir={podeGerenciar ? (item) => setConfirmarExclusao(item) : undefined}
                onToggleStatus={
                  podeGerenciar && togglando !== a.id ? toggleStatus : undefined
                }
              />
            </div>
          ))}
        </div>
      )}

      <AreaComumFormModal
        aberto={modalForm.aberto}
        area={modalForm.area}
        onFechar={() => setModalForm({ aberto: false, area: null })}
        onSalvar={salvar}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir área comum"
        mensagem={
          confirmarExclusao
            ? `Tem certeza que deseja desativar "${confirmarExclusao.nome}"? A área deixará de aceitar novas reservas (o histórico é preservado).`
            : ''
        }
        textoConfirmar="Desativar"
        corConfirmar="warning"
        carregando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setConfirmarExclusao(null)}
      />
    </>
  );
}