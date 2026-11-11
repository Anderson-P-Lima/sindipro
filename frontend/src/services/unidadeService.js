import api from './api';

export const unidadeService = {
  async listar({ blocoId, ativo } = {}) {
    const params = {};
    if (blocoId) params.blocoId = blocoId;
    if (ativo !== undefined) params.ativo = ativo;
    const { data } = await api.get('/unidades', { params });
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/unidades', payload);
    return data;
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/unidades/${id}`, payload);
    return data;
  },

  async alterarStatus(id, ativo) {
    const { data } = await api.patch(`/unidades/${id}/status`, null, {
      params: { ativo },
    });
    return data;
  },

  async deletar(id) {
    await api.delete(`/unidades/${id}`);
  },
};

export const blocoService = {
  async listar() {
    const { data } = await api.get('/blocos');
    return data;
  },
  async criar(payload) {
    const { data } = await api.post('/blocos', payload);
    return data;
  },
  async deletar(id) {
    await api.delete(`/blocos/${id}`);
  },
};