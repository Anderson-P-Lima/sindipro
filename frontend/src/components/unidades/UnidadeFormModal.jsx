import { useEffect, useRef, useState } from 'react';

const formVazio = { blocoId: '', numero: '', andar: '' };

export default function UnidadeFormModal({ aberto, unidade, blocos, onFechar, onSalvar }) {
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const primeiroRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setForm(
        unidade
          ? {
              blocoId: unidade.blocoId,
              numero: unidade.numero,
              andar: unidade.andar ?? '',
            }
          : formVazio
      );
      setErro('');
      setTimeout(() => primeiroRef.current?.focus(), 100);
    }
  }, [aberto, unidade]);

  const handleChange = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (!form.blocoId) return setErro('Selecione o bloco.');
    if (!form.numero.trim()) return setErro('Informe o número da unidade.');

    setSalvando(true);
    try {
      const payload = {
        blocoId: Number(form.blocoId),
        numero: form.numero.trim(),
        andar: form.andar === '' ? null : Number(form.andar),
      };
      await onSalvar(payload);
      onFechar();
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.details?.join(', ')
        || 'Não foi possível salvar a unidade.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;
  const modoEdicao = Boolean(unidade);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-unidade-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-unidade-titulo">
                {modoEdicao ? 'Editar unidade' : 'Nova unidade'}
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
                <label htmlFor="blocoId" className="form-label">
                  Bloco <span className="text-danger">*</span>
                </label>
                <select
                  ref={primeiroRef}
                  id="blocoId"
                  className="form-select"
                  value={form.blocoId}
                  onChange={handleChange('blocoId')}
                  required
                  aria-required="true"
                  disabled={salvando}
                >
                  <option value="">Selecione...</option>
                  {blocos.map((b) => (
                    <option key={b.id} value={b.id}>{b.nome}</option>
                  ))}
                </select>
              </div>

              <div className="row g-3 mb-0">
                <div className="col-md-6">
                  <label htmlFor="numero" className="form-label">
                    Número <span className="text-danger">*</span>
                  </label>
                  <input
                    id="numero"
                    type="text"
                    className="form-control"
                    value={form.numero}
                    onChange={handleChange('numero')}
                    maxLength={10}
                    placeholder="Ex.: 101"
                    required
                    aria-required="true"
                    disabled={salvando}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="andar" className="form-label">Andar</label>
                  <input
                    id="andar"
                    type="number"
                    className="form-control"
                    value={form.andar}
                    onChange={handleChange('andar')}
                    min={0}
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
                {modoEdicao ? 'Salvar alterações' : 'Criar unidade'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}