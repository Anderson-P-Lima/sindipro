import { useEffect, useRef, useState } from 'react';
import { PRIORIDADES } from '../../services/ocorrenciaService';

const formVazio = {
  titulo: '',
  descricao: '',
  prioridade: 'MEDIA',
};

export default function OcorrenciaFormModal({ aberto, onFechar, onSalvar }) {
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputTituloRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setForm(formVazio);
      setErro('');
      setTimeout(() => inputTituloRef.current?.focus(), 100);
    }
  }, [aberto]);

  const handleChange = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSalvar(form);
      onFechar();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.details?.join(', ') ||
        'Não foi possível registrar a ocorrência.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-ocorrencia-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-ocorrencia-titulo">
                Nova ocorrência
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
                <label htmlFor="titulo" className="form-label">
                  Título <span className="text-danger">*</span>
                </label>
                <input
                  ref={inputTituloRef}
                  id="titulo"
                  type="text"
                  className="form-control"
                  value={form.titulo}
                  onChange={handleChange('titulo')}
                  required
                  maxLength={150}
                  aria-required="true"
                  disabled={salvando}
                  placeholder="Resumo curto do problema"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="prioridade" className="form-label">
                  Prioridade
                </label>
                <select
                  id="prioridade"
                  className="form-select"
                  value={form.prioridade}
                  onChange={handleChange('prioridade')}
                  disabled={salvando}
                >
                  {Object.entries(PRIORIDADES).map(([valor, info]) => (
                    <option key={valor} value={valor}>
                      {info.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-0">
                <label htmlFor="descricao" className="form-label">
                  Descrição <span className="text-danger">*</span>
                </label>
                <textarea
                  id="descricao"
                  className="form-control"
                  rows={5}
                  value={form.descricao}
                  onChange={handleChange('descricao')}
                  required
                  aria-required="true"
                  disabled={salvando}
                  placeholder="Descreva o problema com detalhes"
                ></textarea>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onFechar}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                Registrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}