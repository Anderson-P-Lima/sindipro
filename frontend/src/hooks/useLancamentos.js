import { useCallback, useEffect, useState } from 'react';
import { lancamentoService } from '../services/lancamentoService';

export function useLancamentos() {
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
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await lancamentoService.listar({
        page,
        size: 15,
        tipo: tipo || undefined,
        status: status || undefined,
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar os lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [page, tipo, status]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPage(0);
  }, [tipo, status]);

  return {
    data,
    loading,
    erro,
    page,
    setPage,
    tipo,
    setTipo,
    status,
    setStatus,
    recarregar: carregar,
  };
}