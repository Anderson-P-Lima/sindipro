import { useEffect, useRef, useState } from 'react';

const formVazio = {
  nome: '',
  descricao: '',
  capacidade: '',
  horarioIni: '10:00',
  horarioFim: '22:00',
  taxa: '0.00',
};

export default function AreaComumFormModal({ aberto, area, onFechar, onSalvar }) {
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputNomeRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setForm(
        area
          ? {
              nome: area.nome,
              descricao: area.descricao || '',
              capacidade: area.capacidade ?? '',
              horarioIni: area.horarioIni?.slice(0, 5) || '10:00',
              horarioFim: area.horarioFim?.slice(0, 5) || '22:00',
              taxa: Number(area.taxa ?? 0).toFixed(2),
            }
          : formVazio
      );
      setErro('');
      setTimeout(() => inputNomeRef.current?.focus(), 100);
    }
  }, [aberto, area]);

  const handleChange = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        capacidade: form.capacidade === '' ? null : Number(form.capacidade),
        horarioIni: form.horarioIni.length === 5 ? `${form.horarioIni}:00` : form.horarioIni,
        horarioFim: form.horarioFim.length === 5 ? `${form.horarioFim}:00` : form.horarioFim,
        taxa: Number(form.taxa),
      };
      await onSalvar(payload);
      onFechar();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.details?.join(', ') ||
        'Não foi possível salvar a área comum.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const modoEdicao = Boolean(area);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-area-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-area-titulo">
                {modoEdicao ? 'Editar área comum' : 'Nova área comum'}
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
                  Nome <span className="text-danger">*</span>
                </label>
                <input
                  ref={inputNomeRef}
                  id="nome"
                  type="text"
                  className="form-control"
                  value={form.nome}
                  onChange={handleChange('nome')}
                  required
                  maxLength={80}
                  aria-required="true"
                  disabled={salvando}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="descricao" className="form-label">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  className="form-control"
                  rows={3}
                  value={form.descricao}
                  onChange={handleChange('descricao')}
                  maxLength={255}
                  disabled={salvando}
                ></textarea>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label htmlFor="capacidade" className="form-label">
                    Capacidade
                  </label>
                  <input
                    id="capacidade"
                    type="number"
                    className="form-control"
                    value={form.capacidade}
                    onChange={handleChange('capacidade')}
                    min={1}
                    placeholder="Opcional"
                    disabled={salvando}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="horarioIni" className="form-label">
                    Horário de abertura <span className="text-danger">*</span>
                  </label>
                  <input
                    id="horarioIni"
                    type="time"
                    className="form-control"
                    value={form.horarioIni}
                    onChange={handleChange('horarioIni')}
                    required
                    aria-required="true"
                    disabled={salvando}
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="horarioFim" className="form-label">
                    Horário de fechamento <span className="text-danger">*</span>
                  </label>
                  <input
                    id="horarioFim"
                    type="time"
                    className="form-control"
                    value={form.horarioFim}
                    onChange={handleChange('horarioFim')}
                    required
                    aria-required="true"
                    disabled={salvando}
                  />
                </div>
              </div>

              <div className="mb-0">
                <label htmlFor="taxa" className="form-label">
                  Taxa de reserva (R$) <span className="text-danger">*</span>
                </label>
                <input
                  id="taxa"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  value={form.taxa}
                  onChange={handleChange('taxa')}
                  required
                  aria-required="true"
                  disabled={salvando}
                />
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
                {modoEdicao ? 'Salvar alterações' : 'Criar área'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}