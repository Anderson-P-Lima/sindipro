import { useEffect, useRef, useState } from 'react';
import { CATEGORIAS } from '../../services/comunicadoService';

const formVazio = {
  titulo: '',
  conteudo: '',
  categoria: 'GERAL',
  fixado: false,
};

export default function ComunicadoFormModal({ aberto, comunicado, onFechar, onSalvar }) {
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputTituloRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setForm(
        comunicado
          ? {
              titulo: comunicado.titulo,
              conteudo: comunicado.conteudo,
              categoria: comunicado.categoria,
              fixado: comunicado.fixado,
            }
          : formVazio
      );
      setErro('');
      setTimeout(() => inputTituloRef.current?.focus(), 100);
    }
  }, [aberto, comunicado]);

  const handleChange = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
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
        'Não foi possível salvar o comunicado.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const modoEdicao = Boolean(comunicado);

  return (
    <>
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-comunicado-titulo"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-header">
                <h2 className="modal-title h5" id="form-comunicado-titulo">
                  {modoEdicao ? 'Editar comunicado' : 'Novo comunicado'}
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
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-8">
                    <label htmlFor="categoria" className="form-label">
                      Categoria <span className="text-danger">*</span>
                    </label>
                    <select
                      id="categoria"
                      className="form-select"
                      value={form.categoria}
                      onChange={handleChange('categoria')}
                      required
                      aria-required="true"
                      disabled={salvando}
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c.valor} value={c.valor}>
                          {c.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        id="fixado"
                        type="checkbox"
                        className="form-check-input"
                        checked={form.fixado}
                        onChange={handleChange('fixado')}
                        disabled={salvando}
                      />
                      <label htmlFor="fixado" className="form-check-label">
                        Fixar no topo
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-0">
                  <label htmlFor="conteudo" className="form-label">
                    Conteúdo <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="conteudo"
                    className="form-control"
                    rows={6}
                    value={form.conteudo}
                    onChange={handleChange('conteudo')}
                    required
                    aria-required="true"
                    disabled={salvando}
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
                  {modoEdicao ? 'Salvar alterações' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}