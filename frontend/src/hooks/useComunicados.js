import { useCallback, useEffect, useState } from 'react';
import { comunicadoService } from '../services/comunicadoService';

export function useComunicados() {
  const [data, setData] = useState({
    content: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [page, setPage] = useState(0);
  const [categoria, setCategoria] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await comunicadoService.listar({
        page,
        size: 12,
        categoria: categoria || undefined,
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar os comunicados.');
    } finally {
      setLoading(false);
    }
  }, [page, categoria]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Reseta a página quando muda o filtro
  useEffect(() => {
    setPage(0);
  }, [categoria]);

  return {
    data,
    loading,
    erro,
    page,
    setPage,
    categoria,
    setCategoria,
    recarregar: carregar,
  };
}