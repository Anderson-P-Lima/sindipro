import api from './api';

export const areaComumService = {
  async listar({ ativo } = {}) {
    const params = {};
    if (ativo !== undefined && ativo !== null) params.ativo = ativo;
    const { data } = await api.get('/areas-comuns', { params });
    return data;
  },

  async buscar(id) {
    const { data } = await api.get(`/areas-comuns/${id}`);
    return data;
  },

  async criar(payload) {
    const { data } = await api.post('/areas-comuns', payload);
    return data;
  },

  async atualizar(id, payload) {
    const { data } = await api.put(`/areas-comuns/${id}`, payload);
    return data;
  },

  async alterarStatus(id, ativo) {
    const { data } = await api.patch(`/areas-comuns/${id}/status`, null, {
      params: { ativo },
    });
    return data;
  },

  async deletar(id) {
    await api.delete(`/areas-comuns/${id}`);
  },
};