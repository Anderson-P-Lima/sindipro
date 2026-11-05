import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useComunicados } from '../hooks/useComunicados';
import { usePageTitle } from '../hooks/usePageTitle';
import { comunicadoService, CATEGORIAS } from '../services/comunicadoService';
import ComunicadoCard from '../components/comunicados/ComunicadoCard';
import ComunicadoFormModal from '../components/comunicados/ComunicadoFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export default function Comunicados() {
  usePageTitle('Comunicados — SindiPro', 'Mural de comunicados do condomínio.');

  const { user } = useAuth();
  const podeGerenciar = user?.role === 'ADMIN_SISTEMA' || user?.role === 'SINDICO';

  const { data, loading, erro, page, setPage, categoria, setCategoria, recarregar } =
    useComunicados();

  const [modalForm, setModalForm] = useState({ aberto: false, comunicado: null });
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const salvar = async (dados) => {
    if (modalForm.comunicado) {
      await comunicadoService.atualizar(modalForm.comunicado.id, dados);
    } else {
      await comunicadoService.criar(dados);
    }
    await recarregar();
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      await comunicadoService.deletar(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await recarregar();
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Comunicados</h1>
          <p className="text-secondary mb-0">
            Avisos e informações do condomínio
          </p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalForm({ aberto: true, comunicado: null })}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Novo comunicado
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label htmlFor="filtro-categoria" className="col-form-label small text-secondary">
                Filtrar por categoria:
              </label>
            </div>
            <div className="col-md-4">
              <select
                id="filtro-categoria"
                className="form-select form-select-sm"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div className="col text-md-end">
              <small className="text-secondary">
                {data.totalElements} {data.totalElements === 1 ? 'comunicado' : 'comunicados'}
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
          icone="bi-megaphone"
          titulo="Nenhum comunicado encontrado"
          descricao={
            categoria
              ? 'Nenhum resultado para o filtro selecionado.'
              : 'Ainda não há comunicados publicados.'
          }
          acao={
            podeGerenciar && !categoria ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalForm({ aberto: true, comunicado: null })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Publicar o primeiro
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="row g-3">
            {data.content.map((c) => (
              <div key={c.id} className="col-12 col-md-6 col-xl-4">
                <ComunicadoCard
                  comunicado={c}
                  onEditar={
                    podeGerenciar
                      ? (item) => setModalForm({ aberto: true, comunicado: item })
                      : undefined
                  }
                  onExcluir={podeGerenciar ? (item) => setConfirmarExclusao(item) : undefined}
                />
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <ComunicadoFormModal
        aberto={modalForm.aberto}
        comunicado={modalForm.comunicado}
        onFechar={() => setModalForm({ aberto: false, comunicado: null })}
        onSalvar={salvar}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir comunicado"
        mensagem={
          confirmarExclusao
            ? `Tem certeza que deseja excluir "${confirmarExclusao.titulo}"? Essa ação não pode ser desfeita.`
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