import { renderHook, waitFor, act } from '@testing-library/react';
import { useComunicados } from '../../hooks/useComunicados';
import { comunicadoService } from '../../services/comunicadoService';

jest.mock('../../services/comunicadoService');

describe('useComunicados', () => {
  beforeEach(() => jest.clearAllMocks());

  it('carrega lista na montagem', async () => {
    const payload = {
      content: [{ id: 1, titulo: 'Aviso' }],
      page: 0,
      totalPages: 1,
      totalElements: 1,
      last: true,
    };
    comunicadoService.listar.mockResolvedValue(payload);

    const { result } = renderHook(() => useComunicados());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data.content).toHaveLength(1);
    expect(result.current.erro).toBeNull();
    expect(comunicadoService.listar).toHaveBeenCalledWith({
      page: 0,
      size: 12,
      categoria: undefined,
    });
  });

  it('captura erro da API', async () => {
    comunicadoService.listar.mockRejectedValue({
      response: { data: { message: 'Falhou' } },
    });

    const { result } = renderHook(() => useComunicados());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.erro).toBe('Falhou');
    expect(result.current.data.content).toEqual([]);
  });

  it('muda categoria reseta página', async () => {
    comunicadoService.listar.mockResolvedValue({
      content: [], page: 0, totalPages: 0, totalElements: 0, last: true,
    });

    const { result } = renderHook(() => useComunicados());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
      result.current.setCategoria('URGENTE');
    });

    await waitFor(() => {
      expect(result.current.page).toBe(0);
      expect(result.current.categoria).toBe('URGENTE');
    });
  });
});