import { comunicadoService, CATEGORIAS, categoriaInfo } from '../../services/comunicadoService';
import api from '../../services/api';

jest.mock('../../services/api');

describe('comunicadoService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listar', () => {
    it('chama GET /comunicados com paginação padrão', async () => {
      api.get.mockResolvedValue({ data: { content: [] } });

      await comunicadoService.listar();

      expect(api.get).toHaveBeenCalledWith('/comunicados', {
        params: { page: 0, size: 12 },
      });
    });

    it('inclui categoria quando informada', async () => {
      api.get.mockResolvedValue({ data: { content: [] } });

      await comunicadoService.listar({ page: 1, categoria: 'URGENTE' });

      expect(api.get).toHaveBeenCalledWith('/comunicados', {
        params: { page: 1, size: 12, categoria: 'URGENTE' },
      });
    });
  });

  describe('criar', () => {
    it('chama POST com payload', async () => {
      const payload = { titulo: 'X', conteudo: 'Y', categoria: 'GERAL' };
      api.post.mockResolvedValue({ data: { id: 1 } });

      const resp = await comunicadoService.criar(payload);

      expect(api.post).toHaveBeenCalledWith('/comunicados', payload);
      expect(resp.id).toBe(1);
    });
  });

  describe('atualizar', () => {
    it('chama PUT com id na URL', async () => {
      api.put.mockResolvedValue({ data: { id: 5 } });
      await comunicadoService.atualizar(5, { titulo: 'X' });
      expect(api.put).toHaveBeenCalledWith('/comunicados/5', { titulo: 'X' });
    });
  });

  describe('deletar', () => {
    it('chama DELETE com id', async () => {
      api.delete.mockResolvedValue({});
      await comunicadoService.deletar(7);
      expect(api.delete).toHaveBeenCalledWith('/comunicados/7');
    });
  });
});

describe('categoriaInfo', () => {
  expect(categoriaInfo('URGENTE')).toMatchObject({
    valor: 'URGENTE',
    rotulo: 'Urgente',
    cor: 'danger',
  });

  it('retorna fallback para categoria desconhecida', () => {
    expect(categoriaInfo('INEXISTENTE')).toEqual({
      rotulo: 'INEXISTENTE',
      cor: 'secondary',
    });
  });
});