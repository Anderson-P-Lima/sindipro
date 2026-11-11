import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLancamentos } from '../hooks/useLancamentos';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  lancamentoService, TIPOS, STATUS_FIN, formatarMoeda, formatarData,
} from '../services/lancamentoService';
import LancamentoFormModal from '../components/financeiro/LancamentoFormModal';
import RegistrarPagamentoModal from '../components/financeiro/RegistrarPagamentoModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export default function Financeiro() {
  usePageTitle('Financeiro — SindiPro', 'Gestão financeira do condomínio.');

  const { user } = useAuth();
  const podeGerenciar = ['ADMIN_SISTEMA', 'SINDICO'].includes(user?.role);
  const isAdmin = user?.role === 'ADMIN_SISTEMA';

  const {
    data, loading, erro, page, setPage, tipo, setTipo, status, setStatus, recarregar,
  } = useLancamentos();

  const [modalForm, setModalForm] = useState({ aberto: false, lancamento: null });
  const [pagando, setPagando] = useState(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const salvar = async (payload) => {
    if (modalForm.lancamento) {
      await lancamentoService.atualizar(modalForm.lancamento.id, payload);
    } else {
      await lancamentoService.criar(payload);
    }
    await recarregar();
  };

  const registrarPagamento = async (id, dataPagamento) => {
    await lancamentoService.registrarPagamento(id, dataPagamento);
    await recarregar();
  };

  const cancelar = async () => {
    setProcessando(true);
    try {
      await lancamentoService.cancelar(confirmarCancelamento.id);
      setConfirmarCancelamento(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível cancelar.');
    } finally {
      setProcessando(false);
    }
  };

  const excluir = async () => {
    setProcessando(true);
    try {
      await lancamentoService.deletar(confirmarExclusao.id);
      setConfirmarExclusao(null);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível excluir.');
    } finally {
      setProcessando(false);
    }
  };

  const podeEditar = (l) => ['PENDENTE', 'ATRASADO'].includes(l.status);
  const podePagar = (l) => ['PENDENTE', 'ATRASADO'].includes(l.status);
  const podeCancelar = (l) => ['PENDENTE', 'ATRASADO'].includes(l.status);
  const podeExcluir = (l) => l.status === 'PENDENTE';

  const totais = data.content.reduce(
    (acc, l) => {
      const v = Number(l.valor);
      if (l.tipo === 'RECEITA' && l.status === 'PAGO') acc.receitas += v;
      if (l.tipo === 'DESPESA' && l.status === 'PAGO') acc.despesas += v;
      if (['PENDENTE', 'ATRASADO'].includes(l.status)) acc.emAberto += v;
      return acc;
    },
    { receitas: 0, despesas: 0, emAberto: 0 }
  );

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h1 className="h3 mb-1">Financeiro</h1>
          <p className="text-secondary mb-0">Lançamentos de receitas e despesas</p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalForm({ aberto: true, lancamento: null })}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Novo lançamento
          </button>
        )}
      </div>

      {podeGerenciar && data.content.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-start border-4 border-success">
              <div className="card-body py-2">
                <small className="text-secondary d-block">Receitas pagas</small>
                <h3 className="h5 mb-0 text-success">{formatarMoeda(totais.receitas)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-start border-4 border-danger">
              <div className="card-body py-2">
                <small className="text-secondary d-block">Despesas pagas</small>
                <h3 className="h5 mb-0 text-danger">{formatarMoeda(totais.despesas)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-start border-4 border-warning">
              <div className="card-body py-2">
                <small className="text-secondary d-block">Em aberto (página)</small>
                <h3 className="h5 mb-0 text-warning">{formatarMoeda(totais.emAberto)}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label htmlFor="filtro-tipo" className="col-form-label small text-secondary">Tipo:</label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-tipo"
                className="form-select form-select-sm"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(TIPOS).map(([v, info]) => (
                  <option key={v} value={v}>{info.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <label htmlFor="filtro-status" className="col-form-label small text-secondary">Status:</label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-status"
                className="form-select form-select-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(STATUS_FIN).map(([v, info]) => (
                  <option key={v} value={v}>{info.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="col text-md-end">
              <small className="text-secondary">
                {data.totalElements} {data.totalElements === 1 ? 'lançamento' : 'lançamentos'}
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
      ) : data.content.length === 0 ? (
        <EmptyState
          icone="bi-cash-coin"
          titulo="Nenhum lançamento encontrado"
          descricao={
            tipo || status
              ? 'Nenhum resultado para os filtros selecionados.'
              : 'Comece registrando a primeira receita ou despesa.'
          }
          acao={
            podeGerenciar && !tipo && !status ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalForm({ aberto: true, lancamento: null })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Novo lançamento
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Vencimento</th>
                    <th scope="col">Descrição</th>
                    <th scope="col" className="d-none d-md-table-cell">Categoria</th>
                    <th scope="col" className="text-end">Valor</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((l) => {
                    const tp = TIPOS[l.tipo];
                    const st = STATUS_FIN[l.status];
                    return (
                      <tr key={l.id}>
                        <td className="text-nowrap">{formatarData(l.dataVencimento)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge bg-${tp.cor}`}>{tp.rotulo}</span>
                            <span className="text-truncate" style={{ maxWidth: 260 }}>{l.descricao}</span>
                          </div>
                          {l.unidadeNumero && (
                            <small className="text-secondary d-block mt-1">
                              <i className="bi bi-house-door me-1" aria-hidden="true"></i>
                              {l.blocoNome ? `${l.blocoNome} — ` : ''}Apto {l.unidadeNumero}
                            </small>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell">
                          <small className="text-secondary">{l.categoria}</small>
                        </td>
                        <td className="text-end fw-semibold text-nowrap">
                          <span className={l.tipo === 'RECEITA' ? 'text-success' : 'text-danger'}>
                            {l.tipo === 'RECEITA' ? '+' : '−'} {formatarMoeda(l.valor)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${st.cor}`}>{st.rotulo}</span>
                        </td>
                        <td className="text-end">
                          {podeGerenciar && (
                            <div className="btn-group btn-group-sm">
                              {podePagar(l) && (
                                <button
                                  type="button"
                                  className="btn btn-outline-success border-0"
                                  onClick={() => setPagando(l)}
                                  aria-label={`Registrar pagamento de ${l.descricao}`}
                                  title="Registrar pagamento"
                                >
                                  <i className="bi bi-check-circle" aria-hidden="true"></i>
                                </button>
                              )}
                              {podeEditar(l) && (
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary border-0"
                                  onClick={() => setModalForm({ aberto: true, lancamento: l })}
                                  aria-label={`Editar ${l.descricao}`}
                                  title="Editar"
                                >
                                  <i className="bi bi-pencil" aria-hidden="true"></i>
                                </button>
                              )}
                              {podeCancelar(l) && (
                                <button
                                  type="button"
                                  className="btn btn-outline-warning border-0"
                                  onClick={() => setConfirmarCancelamento(l)}
                                  aria-label={`Cancelar ${l.descricao}`}
                                  title="Cancelar"
                                >
                                  <i className="bi bi-x-circle" aria-hidden="true"></i>
                                </button>
                              )}
                              {isAdmin && podeExcluir(l) && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger border-0"
                                  onClick={() => setConfirmarExclusao(l)}
                                  aria-label={`Excluir ${l.descricao}`}
                                  title="Excluir"
                                >
                                  <i className="bi bi-trash" aria-hidden="true"></i>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      <LancamentoFormModal
        aberto={modalForm.aberto}
        lancamento={modalForm.lancamento}
        onFechar={() => setModalForm({ aberto: false, lancamento: null })}
        onSalvar={salvar}
      />

      <RegistrarPagamentoModal
        aberto={Boolean(pagando)}
        lancamento={pagando}
        onFechar={() => setPagando(null)}
        onConfirmar={registrarPagamento}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarCancelamento)}
        titulo="Cancelar lançamento"
        mensagem={confirmarCancelamento
          ? `Cancelar "${confirmarCancelamento.descricao}"? O lançamento será marcado como CANCELADO.`
          : ''}
        textoConfirmar="Cancelar lançamento"
        corConfirmar="warning"
        carregando={processando}
        onConfirmar={cancelar}
        onCancelar={() => setConfirmarCancelamento(null)}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir lançamento"
        mensagem={confirmarExclusao
          ? `Excluir permanentemente "${confirmarExclusao.descricao}"?`
          : ''}
        textoConfirmar="Excluir"
        corConfirmar="danger"
        carregando={processando}
        onConfirmar={excluir}
        onCancelar={() => setConfirmarExclusao(null)}
      />
    </>
  );
}