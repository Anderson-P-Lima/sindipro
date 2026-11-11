import api from './api';

export const ocorrenciaService = {
  async listar({ page = 0, size = 10, status, prioridade } = {}) {
    const params = { page, size };
    if (status) params.status = status;
    if (prioridade) params.prioridade = prioridade;
    const { data } = await api.get('/ocorrencias', { params });
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/ocorrencias', payload);
    return data;
  },

  async alterarStatus(id, status) {
    const { data } = await api.patch(`/ocorrencias/${id}/status`, { status });
    return data;
  },

  async atribuirResponsavel(id, responsavelId) {
    const { data } = await api.patch(`/ocorrencias/${id}/responsavel`, { responsavelId });
    return data;
  },

  async deletar(id) {
    await api.delete(`/ocorrencias/${id}`);
  },

  async responsaveisElegiveis() {
    const { data } = await api.get('/ocorrencias/responsaveis-elegiveis');
    return data;
  },
};

export const STATUS = {
  ABERTA:       { rotulo: 'Aberta',       cor: 'primary'   },
  EM_ANDAMENTO: { rotulo: 'Em andamento', cor: 'warning'   },
  RESOLVIDA:    { rotulo: 'Resolvida',    cor: 'success'   },
  CANCELADA:    { rotulo: 'Cancelada',    cor: 'secondary' },
};

export const PRIORIDADES = {
  BAIXA:   { rotulo: 'Baixa',   cor: 'secondary' },
  MEDIA:   { rotulo: 'Média',   cor: 'info'      },
  ALTA:    { rotulo: 'Alta',    cor: 'warning'   },
  URGENTE: { rotulo: 'Urgente', cor: 'danger'    },
};