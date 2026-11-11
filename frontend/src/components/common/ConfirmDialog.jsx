import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  aberto,
  titulo = 'Confirmar ação',
  mensagem,
  textoConfirmar = 'Confirmar',
  corConfirmar = 'danger',
  carregando = false,
  onConfirmar,
  onCancelar,
}) {
  const botaoCancelarRef = useRef(null);

  useEffect(() => {
    if (aberto && botaoCancelarRef.current) {
      botaoCancelarRef.current.focus();
    }
  }, [aberto]);

  if (!aberto) return null;

  return (
    <>
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onKeyDown={(e) => e.key === 'Escape' && onCancelar?.()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="confirm-titulo">{titulo}</h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar"
                onClick={onCancelar}
                disabled={carregando}
              ></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">{mensagem}</p>
            </div>
            <div className="modal-footer">
              <button
                ref={botaoCancelarRef}
                type="button"
                className="btn btn-secondary"
                onClick={onCancelar}
                disabled={carregando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`btn btn-${corConfirmar}`}
                onClick={onConfirmar}
                disabled={carregando}
              >
                {carregando && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                {textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}