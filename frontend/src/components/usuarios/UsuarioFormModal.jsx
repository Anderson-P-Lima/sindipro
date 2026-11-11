import { useEffect, useRef, useState } from 'react';
import { ROLES } from '../../services/usuarioService';

const formVazio = {
  nome: '',
  email: '',
  senha: '',
  cpf: '',
  telefone: '',
  role: 'MORADOR',
};

export default function UsuarioFormModal({ aberto, usuario, onFechar, onSalvar }) {
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const primeiroRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setForm(
        usuario
          ? {
              nome: usuario.nome,
              email: usuario.email,
              senha: '',           // nunca preenche no editar
              cpf: usuario.cpf || '',
              telefone: usuario.telefone || '',
              role: usuario.role,
            }
          : formVazio
      );
      setErro('');
      setTimeout(() => primeiroRef.current?.focus(), 100);
    }
  }, [aberto, usuario]);

  const handleChange = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!form.nome.trim()) return setErro('Informe o nome.');
    if (!form.email.trim()) return setErro('Informe o e-mail.');
    if (!usuario && form.senha.length < 6) {
      return setErro('A senha deve ter no mínimo 6 caracteres.');
    }

    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        cpf: form.cpf.trim() || null,
        telefone: form.telefone.trim() || null,
        role: form.role,
      };
      if (!usuario) payload.senha = form.senha;

      await onSalvar(payload);
      onFechar();
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.details?.join(', ')
        || 'Não foi possível salvar o usuário.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;
  const modoEdicao = Boolean(usuario);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-usuario-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-usuario-titulo">
                {modoEdicao ? 'Editar usuário' : 'Novo usuário'}
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar"
                onClick={onFechar}
                disabled={salvando}
              ></button>
            </div>

            <div className="modal-body">
              {erro && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                  {erro}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="nome" className="form-label">
                  Nome completo <span className="text-danger">*</span>
                </label>
                <input
                  ref={primeiroRef}
                  id="nome"
                  type="text"
                  className="form-control"
                  value={form.nome}
                  onChange={handleChange('nome')}
                  maxLength={120}
                  required
                  aria-required="true"
                  disabled={salvando}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-8">
                  <label htmlFor="email" className="form-label">
                    E-mail <span className="text-danger">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={handleChange('email')}
                    maxLength={150}
                    required
                    aria-required="true"
                    autoComplete="email"
                    disabled={salvando}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="role" className="form-label">
                    Perfil <span className="text-danger">*</span>
                  </label>
                  <select
                    id="role"
                    className="form-select"
                    value={form.role}
                    onChange={handleChange('role')}
                    required
                    aria-required="true"
                    disabled={salvando}
                  >
                    {Object.entries(ROLES).map(([v, info]) => (
                      <option key={v} value={v}>{info.rotulo}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!modoEdicao && (
                <div className="mb-3">
                  <label htmlFor="senha" className="form-label">
                    Senha <span className="text-danger">*</span>
                  </label>
                  <input
                    id="senha"
                    type="password"
                    className="form-control"
                    value={form.senha}
                    onChange={handleChange('senha')}
                    minLength={6}
                    maxLength={100}
                    required
                    aria-required="true"
                    autoComplete="new-password"
                    disabled={salvando}
                  />
                  <div className="form-text">Mínimo de 6 caracteres.</div>
                </div>
              )}

              <div className="row g-3 mb-0">
                <div className="col-md-6">
                  <label htmlFor="cpf" className="form-label">CPF</label>
                  <input
                    id="cpf"
                    type="text"
                    className="form-control"
                    value={form.cpf}
                    onChange={handleChange('cpf')}
                    maxLength={14}
                    placeholder="Opcional"
                    disabled={salvando}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="telefone" className="form-label">Telefone</label>
                  <input
                    id="telefone"
                    type="text"
                    className="form-control"
                    value={form.telefone}
                    onChange={handleChange('telefone')}
                    maxLength={20}
                    placeholder="Opcional"
                    disabled={salvando}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onFechar}
                disabled={salvando}
              >Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {modoEdicao ? 'Salvar alterações' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}