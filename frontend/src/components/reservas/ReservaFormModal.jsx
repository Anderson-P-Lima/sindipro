import { useEffect, useRef, useState } from 'react';
import { areaComumService } from '../../services/areaComumService';
import api from '../../services/api';
import { reservaService, construirInstant } from '../../services/reservaService';
import { useAuth } from '../../contexts/AuthContext';

const formVazio = {
  areaComumId: '',
  unidadeId: '',
  data: '',
  horaIni: '18:00',
  horaFim: '21:00',
  observacao: '',
};

export default function ReservaFormModal({ aberto, onFechar, onSalvar }) {
  const { user } = useAuth();
  const [form, setForm] = useState(formVazio);
  const [areas, setAreas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const primeiroCampoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setForm(formVazio);
    setErro('');
    setCarregandoDados(true);

    const paramsUnidades =
      user?.role === 'MORADOR'
        ? { ativo: true, minhas: true }
        : { ativo: true };

    Promise.all([
      areaComumService.listar({ ativo: true }),
      api.get('/unidades', { params: paramsUnidades }).then((r) => r.data),
    ])
      .then(([listaAreas, listaUnidades]) => {
        setAreas(listaAreas);
        setUnidades(listaUnidades);
      })
      .catch(() =>
        setErro('Não foi possível carregar áreas e unidades. Tente novamente.')
      )
      .finally(() => {
        setCarregandoDados(false);
        setTimeout(() => primeiroCampoRef.current?.focus(), 100);
      });
  }, [aberto, user]);

  const handleChange = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const areaSelecionada = areas.find((a) => String(a.id) === String(form.areaComumId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!form.areaComumId) return setErro('Selecione a área comum.');
    if (!form.unidadeId) return setErro('Selecione a unidade.');
    if (!form.data) return setErro('Informe a data.');
    if (!form.horaIni || !form.horaFim) return setErro('Informe os horários.');

    if (form.horaFim <= form.horaIni) {
      return setErro('O horário de término deve ser posterior ao de início.');
    }

    if (areaSelecionada) {
      const hIni = areaSelecionada.horarioIni.slice(0, 5);
      const hFim = areaSelecionada.horarioFim.slice(0, 5);
      if (form.horaIni < hIni || form.horaFim > hFim) {
        return setErro(
          `Horário fora do permitido para ${areaSelecionada.nome} (${hIni} – ${hFim}).`
        );
      }
    }

    setSalvando(true);
    try {
      const payload = {
        areaComumId: Number(form.areaComumId),
        unidadeId: Number(form.unidadeId),
        inicio: construirInstant(form.data, form.horaIni),
        fim: construirInstant(form.data, form.horaFim),
        observacao: form.observacao.trim() || null,
      };
      await onSalvar(payload);
      onFechar();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.details?.join(', ') ||
        'Não foi possível criar a reserva.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-reserva-titulo"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onKeyDown={(e) => e.key === 'Escape' && !salvando && onFechar()}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title h5" id="form-reserva-titulo">
                Nova reserva
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

              {carregandoDados ? (
                <div className="text-center py-4" role="status">
                  <div className="spinner-border text-primary" aria-hidden="true"></div>
                  <p className="text-secondary mt-2 mb-0">Carregando dados...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label htmlFor="areaComumId" className="form-label">
                      Área comum <span className="text-danger">*</span>
                    </label>
                    <select
                      ref={primeiroCampoRef}
                      id="areaComumId"
                      className="form-select"
                      value={form.areaComumId}
                      onChange={handleChange('areaComumId')}
                      required
                      aria-required="true"
                      disabled={salvando}
                    >
                      <option value="">Selecione...</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome} ({a.horarioIni.slice(0, 5)} – {a.horarioFim.slice(0, 5)}
                          {a.taxa > 0 ? ` · R$ ${Number(a.taxa).toFixed(2)}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unidadeId" className="form-label">
                      Unidade <span className="text-danger">*</span>
                    </label>
                    {unidades.length === 0 ? (
                      <div className="alert alert-warning mb-0">
                        <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                        Você não tem unidade vinculada. Contate o síndico.
                      </div>
                    ) : (
                      <select
                        id="unidadeId"
                        className="form-select"
                        value={form.unidadeId}
                        onChange={handleChange('unidadeId')}
                        required
                        aria-required="true"
                        disabled={salvando}
                      >
                        <option value="">Selecione...</option>
                        {unidades.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.blocoNome ? `${u.blocoNome} — ` : ''}Apto {u.numero}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label htmlFor="data" className="form-label">
                        Data <span className="text-danger">*</span>
                      </label>
                      <input
                        id="data"
                        type="date"
                        className="form-control"
                        min={hoje}
                        value={form.data}
                        onChange={handleChange('data')}
                        required
                        aria-required="true"
                        disabled={salvando}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="horaIni" className="form-label">
                        Início <span className="text-danger">*</span>
                      </label>
                      <input
                        id="horaIni"
                        type="time"
                        className="form-control"
                        value={form.horaIni}
                        onChange={handleChange('horaIni')}
                        required
                        aria-required="true"
                        disabled={salvando}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="horaFim" className="form-label">
                        Término <span className="text-danger">*</span>
                      </label>
                      <input
                        id="horaFim"
                        type="time"
                        className="form-control"
                        value={form.horaFim}
                        onChange={handleChange('horaFim')}
                        required
                        aria-required="true"
                        disabled={salvando}
                      />
                    </div>
                  </div>

                  <div className="mb-0">
                    <label htmlFor="observacao" className="form-label">
                      Observações
                    </label>
                    <textarea
                      id="observacao"
                      className="form-control"
                      rows={2}
                      maxLength={500}
                      value={form.observacao}
                      onChange={handleChange('observacao')}
                      disabled={salvando}
                      placeholder="Opcional"
                    ></textarea>
                  </div>
                </>
              )}
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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={salvando || carregandoDados || unidades.length === 0}
              >
                {salvando && (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                )}
                Solicitar reserva
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}