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
    data, loading, erro, page, setPage, tipo, setTipo, status, setStatus,
    dataInicio, setDataInicio, dataFim, setDataFim, descricao, setDescricao, categoria, setCategoria, recarregar,
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
            className="btn btn-brand"
            onClick={() => setModalForm({ aberto: true, lancamento: null })}
          >
            <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
            Novo lançamento
          </button>
        )}
      </div>

      {/* CARDS DE RESUMO GLOBAL */}
      {podeGerenciar && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-start border-4 border-success">
              <div className="card-body py-2">
                <small className="text-secondary d-block">Receitas pagas (Total)</small>
                <h3 className="h5 mb-0 text-success">{formatarMoeda(data.resumo?.totalReceitas)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-start border-4 border-danger">
              <div className="card-body py-2">
                <small className="text-secondary d-block">Despesas pagas (Total)</small>
                <h3 className="h5 mb-0 text-danger">{formatarMoeda(data.resumo?.totalDespesas)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-start border-4 border-warning">
              <div className="card-body py-2">
                <small className="text-secondary d-block">Em aberto (Total)</small>
                <h3 className="h5 mb-0 text-warning">{formatarMoeda(data.resumo?.totalEmAberto)}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS EXPANDIDA */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label htmlFor="filtro-tipo" className="form-label small text-secondary mb-1">Tipo</label>
              <select id="filtro-tipo" className="form-select form-select-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos</option>
                {Object.entries(TIPOS).map(([v, info]) => (
                  <option key={v} value={v}>{info.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="filtro-status" className="form-label small text-secondary mb-1">Status</label>
              <select id="filtro-status" className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                {Object.entries(STATUS_FIN).map(([v, info]) => (
                  <option key={v} value={v}>{info.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="filtro-categoria" className="form-label small text-secondary mb-1">Categoria</label>
              <select id="filtro-categoria" className="form-select form-select-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas</option>
                <option value="TAXA_CONDOMINIO">Taxa Condomínio</option>
                <option value="ALUGUEL_AREA">Aluguel Área</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="UTILIDADES">Utilidades</option>
                <option value="FUNCIONARIOS">Funcionários</option>
                <option value="EVENTO">Eventos</option>
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="filtro-inicio" className="form-label small text-secondary mb-1">Venc. de</label>
              <input id="filtro-inicio" type="date" className="form-control form-control-sm" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label htmlFor="filtro-fim" className="form-label small text-secondary mb-1">Venc. até</label>
              <input id="filtro-fim" type="date" className="form-control form-control-sm" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label htmlFor="filtro-busca" className="form-label small text-secondary mb-1">Descrição</label>
              <input id="filtro-busca" type="text" className="form-control form-control-sm" placeholder="Buscar..." value={descricao} onChange={(e) => setDescricao(e.target.value)} />
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
      ) : data.page.content.length === 0 ? (
        <EmptyState
          icone="bi-cash-coin"
          titulo="Nenhum lançamento encontrado"
          descricao={
            tipo || status || descricao || categoria
              ? 'Nenhum resultado para os filtros selecionados.'
              : 'Comece registrando a primeira receita ou despesa.'
          }
          acao={
            podeGerenciar && !tipo && !status && !descricao && !categoria ? (
              <button
                type="button"
                className="btn btn-brand"
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
                  {data.page.content.map((l) => { // AQUI: data.page.content
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
                                <button type="button" className="btn btn-outline-success border-0" onClick={() => setPagando(l)} title="Registrar pagamento">
                                  <i className="bi bi-check-circle" aria-hidden="true"></i>
                                </button>
                              )}
                              {podeEditar(l) && (
                                <button type="button" className="btn btn-outline-secondary border-0" onClick={() => setModalForm({ aberto: true, lancamento: l })} title="Editar">
                                  <i className="bi bi-pencil" aria-hidden="true"></i>
                                </button>
                              )}
                              {podeCancelar(l) && (
                                <button type="button" className="btn btn-outline-warning border-0" onClick={() => setConfirmarCancelamento(l)} title="Cancelar">
                                  <i className="bi bi-x-circle" aria-hidden="true"></i>
                                </button>
                              )}
                              {isAdmin && podeExcluir(l) && (
                                <button type="button" className="btn btn-outline-danger border-0" onClick={() => setConfirmarExclusao(l)} title="Excluir">
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
            <div className="card-footer d-flex justify-content-between align-items-center">
              <small className="text-secondary">
                Total: {data.page.totalElements} lançamentos
              </small>
              <Pagination page={page} totalPages={data.page.totalPages} onChange={setPage} />
            </div>
          </div>
        </>
      )}

      <LancamentoFormModal aberto={modalForm.aberto} lancamento={modalForm.lancamento} onFechar={() => setModalForm({ aberto: false, lancamento: null })} onSalvar={salvar} />
      <RegistrarPagamentoModal aberto={Boolean(pagando)} lancamento={pagando} onFechar={() => setPagando(null)} onConfirmar={registrarPagamento} />
      
      <ConfirmDialog
        aberto={Boolean(confirmarCancelamento)}
        titulo="Cancelar lançamento"
        mensagem={confirmarCancelamento ? `Cancelar "${confirmarCancelamento.descricao}"? O lançamento será marcado como CANCELADO.` : ''}
        textoConfirmar="Cancelar lançamento" corConfirmar="warning" carregando={processando}
        onConfirmar={cancelar} onCancelar={() => setConfirmarCancelamento(null)}
      />
      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Excluir lançamento"
        mensagem={confirmarExclusao ? `Excluir permanentemente "${confirmarExclusao.descricao}"?` : ''}
        textoConfirmar="Excluir" corConfirmar="danger" carregando={processando}
        onConfirmar={excluir} onCancelar={() => setConfirmarExclusao(null)}
      />
    </>
  );
}