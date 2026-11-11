import { useState } from 'react';
import { useUsuarios } from '../hooks/useUsuarios';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  usuarioService, ROLES, roleInfo, formatarDataHora,
} from '../services/usuarioService';
import UsuarioFormModal from '../components/usuarios/UsuarioFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export default function Usuarios() {
  usePageTitle('Usuários — SindiPro', 'Gestão de usuários do sistema.');

  const {
    data, loading, erro, page, setPage, role, setRole, ativo, setAtivo, recarregar,
  } = useUsuarios();

  const [modalForm, setModalForm] = useState({ aberto: false, usuario: null });
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const salvar = async (payload) => {
    if (modalForm.usuario) {
      await usuarioService.atualizar(modalForm.usuario.id, payload);
    } else {
      await usuarioService.criar(payload);
    }
    await recarregar();
  };

  const toggleStatus = async (u) => {
    try {
      await usuarioService.alterarStatus(u.id, !u.ativo);
      await recarregar();
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível alterar o status.');
    }
  };

  const excluir = async () => {
    setProcessando(true);
    try {
      await usuarioService.deletar(confirmarExclusao.id);
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
          <h1 className="h3 mb-1">Usuários</h1>
          <p className="text-secondary mb-0">Gestão de moradores, síndicos e equipe</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalForm({ aberto: true, usuario: null })}
        >
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Novo usuário
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-auto">
              <label htmlFor="filtro-role" className="col-form-label small text-secondary">Perfil:</label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-role"
                className="form-select form-select-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(ROLES).map(([v, info]) => (
                  <option key={v} value={v}>{info.rotulo}</option>
                ))}
              </select>
            </div>
            <div className="col-auto">
              <label htmlFor="filtro-ativo" className="col-form-label small text-secondary">Status:</label>
            </div>
            <div className="col-md-3">
              <select
                id="filtro-ativo"
                className="form-select form-select-sm"
                value={ativo}
                onChange={(e) => setAtivo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="true">Apenas ativos</option>
                <option value="false">Apenas inativos</option>
              </select>
            </div>
            <div className="col text-md-end">
              <small className="text-secondary">
                {data.totalElements} {data.totalElements === 1 ? 'usuário' : 'usuários'}
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
          icone="bi-people"
          titulo="Nenhum usuário encontrado"
          descricao={
            role || ativo
              ? 'Nenhum resultado para os filtros selecionados.'
              : 'Comece cadastrando o primeiro usuário do condomínio.'
          }
          acao={
            !role && !ativo ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalForm({ aberto: true, usuario: null })}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Novo usuário
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
                    <th scope="col">Nome</th>
                    <th scope="col" className="d-none d-md-table-cell">E-mail</th>
                    <th scope="col">Perfil</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="d-none d-lg-table-cell">Último acesso</th>
                    <th scope="col" className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((u) => {
                    const r = roleInfo(u.role);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-semibold">{u.nome}</div>
                          <small className="text-secondary d-md-none">{u.email}</small>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <small>{u.email}</small>
                        </td>
                        <td>
                          <span className={`badge bg-${r.cor}`}>{r.rotulo}</span>
                        </td>
                        <td>
                          <span className={`badge bg-${u.ativo ? 'success' : 'secondary'}`}>
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <small className="text-secondary">
                            {formatarDataHora(u.ultimoLogin)}
                          </small>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary border-0"
                              onClick={() => setModalForm({ aberto: true, usuario: u })}
                              aria-label={`Editar ${u.nome}`}
                              title="Editar"
                            >
                              <i className="bi bi-pencil" aria-hidden="true"></i>
                            </button>
                            <button
                              type="button"
                              className={`btn btn-outline-${u.ativo ? 'warning' : 'success'} border-0`}
                              onClick={() => toggleStatus(u)}
                              aria-label={u.ativo ? `Desativar ${u.nome}` : `Ativar ${u.nome}`}
                              title={u.ativo ? 'Desativar' : 'Ativar'}
                            >
                              <i className={`bi ${u.ativo ? 'bi-pause-circle' : 'bi-play-circle'}`} aria-hidden="true"></i>
                            </button>
                            {u.ativo && (
                              <button
                                type="button"
                                className="btn btn-outline-danger border-0"
                                onClick={() => setConfirmarExclusao(u)}
                                aria-label={`Desativar e excluir ${u.nome}`}
                                title="Desativar (soft delete)"
                              >
                                <i className="bi bi-trash" aria-hidden="true"></i>
                              </button>
                            )}
                          </div>
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

      <UsuarioFormModal
        aberto={modalForm.aberto}
        usuario={modalForm.usuario}
        onFechar={() => setModalForm({ aberto: false, usuario: null })}
        onSalvar={salvar}
      />

      <ConfirmDialog
        aberto={Boolean(confirmarExclusao)}
        titulo="Desativar usuário"
        mensagem={confirmarExclusao
          ? `Desativar o usuário "${confirmarExclusao.nome}"? Ele não poderá mais fazer login, mas o histórico é preservado.`
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