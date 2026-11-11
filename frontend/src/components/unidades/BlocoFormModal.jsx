import { useEffect, useRef, useState } from 'react';

export default function BlocoFormModal({ aberto, onFechar, onSalvar }) {
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (aberto) {
      setNome('');
      setErro('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return setErro('Informe o nome do bloco.');
    setErro('');
    setSalvando(true);
    try {
      await onSalvar({ nome: nome.trim() });
      onFechar();
    } catch (err) {
      const msg = err.response?.data?.message || 'Não foi possível criar o bloco.';
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
      aria-labelledby="form-bloco-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-bloco-titulo">Novo bloco</h2>
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
              <label htmlFor="nomeBloco" className="form-label">
                Nome do bloco <span className="text-danger">*</span>
              </label>
              <input
                ref={inputRef}
                id="nomeBloco"
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={50}
                placeholder="Ex.: Bloco A"
                required
                aria-required="true"
                disabled={salvando}
              />
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
                Criar bloco
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}