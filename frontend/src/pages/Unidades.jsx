import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUnidades } from '../hooks/useUnidades';
import { usePageTitle } from '../hooks/usePageTitle';
import { unidadeService, blocoService } from '../services/unidadeService';
import UnidadeFormModal from '../components/unidades/UnidadeFormModal';
import BlocoFormModal from '../components/unidades/BlocoFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';

export default function Unidades() {
  usePageTitle('Unidades — SindiPro', 'Gestão de blocos e unidades do condomínio.');

  const { user } = useAuth();
  const podeGerenciar = ['ADMIN_SISTEMA', 'SINDICO'].includes(user?.role);

  const {
    unidades, blocos, loading, erro,
    filtroBlocoId, setFiltroBlocoId, filtroAtivo, setFiltroAtivo,
    recarregar,
  } = useUnidades();

  const [modalUnidade, setModalUnidade] = useState({ aberto: false, unidade: null });
  const [modalBloco, setModalBloco] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const salvar = async (payload) => {
    if (modalUnidade.unidade) {
      await unidadeService.atualizar(modalUnidade.unidade.id, payload);
    } else {
      await unidadeService.criar(payload);
    }
    await recarregar();
  };

  const salvarBloco = async (payload) => {
    await blocoService.criar(payload);
    await recarregar();
  };

  const toggleStatus = async (unidade) => {
    try {
      await unidadeService.alterarStatus(unidade.id, !unidade.ativo);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível alterar o status.');
    }
  };

  const excluir = async () => {
    setProcessando(true);
    try {
      await unidadeService.deletar(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível excluir.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Unidades</h1>
          <p className="text-secondary mb-0">Blocos e unidades do condomínio</p>
        </div>
        {podeGerenciar && (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setModalBloco(true)}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Novo bloco
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalUnidade({ aberto: true, unidade: null })}
              disabled={blocos.length === 0}
              title={blocos.length === 0 ? 'Crie um bloco primeiro' : 'Nova unidade'}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Nova unidade
            </button>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label htmlFor="filtro-bloco" className="col-form-label small text-secondary">Bloco:</label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-bloco"
                className="form-select form-select-sm"
                value={filtroBlocoId}
                onChange={(e) => setFiltroBlocoId(e.target.value)}
              >
                <option value="">Todos</option>
                {blocos.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <label htmlFor="filtro-ativo" className="col-form-label small text-secondary">Mostrar:</label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-ativo"
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
                {unidades.length} {unidades.length === 1 ? 'unidade' : 'unidades'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {erro && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
          {erro}
          <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={recarregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5" role="status">
          <div className="spinner-border text-primary" aria-hidden="true"></div>
          <p className="text-secondary mt-2 mb-0">Carregando...</p>
        </div>
      ) : blocos.length === 0 ? (
        <EmptyState
          icone="bi-building"
          titulo="Nenhum bloco cadastrado"
          descricao="Crie um bloco antes de adicionar unidades."
          acao={podeGerenciar ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalBloco(true)}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Criar primeiro bloco
            </button>
          ) : null}
        />
      ) : unidades.length === 0 ? (
        <EmptyState
          icone="bi-house-door"
          titulo={filtroAtivo ? 'Nenhuma unidade ativa' : 'Nenhuma unidade inativa'}
          descricao={
            podeGerenciar
              ? 'Adicione a primeira unidade ao condomínio.'
              : 'O síndico ainda não cadastrou unidades.'
          }
          acao={podeGerenciar && filtroAtivo ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalUnidade({ aberto: true, unidade: null })}
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              Nova unidade
            </button>
          ) : null}
        />
      ) : (
        <div className="row g-3">
          {unidades.map((u) => (
            <div key={u.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <article className="card h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="text-secondary small">{u.blocoNome}</div>
                      <h2 className="h4 mb-0">Apto {u.numero}</h2>
                    </div>
                    <span className={`badge bg-${u.ativo ? 'success' : 'secondary'}`}>
                      {u.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  <p className="text-secondary small mb-3 flex-grow-1">
                    {u.andar !== null && u.andar !== undefined && (
                      <><i className="bi bi-layers me-1" aria-hidden="true"></i>{u.andar}º andar</>
                    )}
                  </p>

                  {podeGerenciar && (
                    <div className="d-flex gap-2 pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary flex-grow-1"
                        onClick={() => setModalUnidade({ aberto: true, unidade: u })}
                        aria-label={`Editar unidade ${u.numero}`}
                      >
                        <i className="bi bi-pencil me-1" aria-hidden="true"></i>Editar
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm btn-outline-${u.ativo ? 'warning' : 'success'}`}
                        onClick={() => toggleStatus(u)}
                        aria-label={u.ativo ? `Desativar ${u.numero}` : `Reativar ${u.numero}`}
                        title={u.ativo ? 'Desativar' : 'Reativar'}
                      >
                        <i className={`bi ${u.ativo ? 'bi-pause-circle' : 'bi-play-circle'}`} aria-hidden="true"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setConfirmarExclusao(u)}
                        aria-label={`Excluir unidade ${u.numero}`}
                        title="Excluir"
                      >
                        <i className="bi bi-trash" aria-hidden="true"></i>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            </div>
          ))}
        </div>
      )}

      <UnidadeFormModal
        aberto={modalUnidade.aberto}
        unidade={modalUnidade.unidade}
        blocos={blocos}
        onFechar={() => setModalUnidade({ aberto: false, unidade: null })}
        onSalvar={salvar}
      />

      <BlocoFormModal
        aberto={modalBloco}
        onFechar={() => setModalBloco(false)}
        onSalvar={salvarBloco}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir unidade"
        mensagem={confirmarExclusao
          ? `Desativar a unidade ${confirmarExclusao.blocoNome} — Apto ${confirmarExclusao.numero}? O histórico é preservado.`
          : ''}
        textoConfirmar="Desativar"
        corConfirmar="warning"
        carregando={processando}
        onConfirmar={excluir}
        onCancelar={() => setConfirmarExclusao(null)}
      />
    </>
  );
}