import api from './api';

export const reservaService = {
  async listar({ page = 0, size = 10, status, areaComumId } = {}) {
    const params = { page, size };
    if (status) params.status = status;
    if (areaComumId) params.areaComumId = areaComumId;
    const { data } = await api.get('/reservas', { params });
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/reservas', payload);
    return data;
  },

  async alterarStatus(id, status) {
    const { data } = await api.patch(`/reservas/${id}/status`, { status });
    return data;
  },

  async deletar(id) {
    await api.delete(`/reservas/${id}`);
  },
};

export const STATUS_RESERVA = {
  PENDENTE:  { rotulo: 'Pendente',  cor: 'warning'   },
  APROVADA:  { rotulo: 'Aprovada',  cor: 'success'   },
  RECUSADA:  { rotulo: 'Recusada',  cor: 'danger'    },
  CANCELADA: { rotulo: 'Cancelada', cor: 'secondary' },
  CONCLUIDA: { rotulo: 'Concluída', cor: 'primary'   },
};

/**
 * Constrói um Instant ISO com offset fixo -03:00 (horário de Brasília).
 * O back-end interpreta reservas em America/Sao_Paulo.
 */
export function construirInstant(data, hora) {
  // data: 'YYYY-MM-DD', hora: 'HH:mm'
  return `${data}T${hora}:00-03:00`;
}

/**
 * Formata um Instant ISO para exibição em horário de Brasília.
 */
export function formatarDataHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}