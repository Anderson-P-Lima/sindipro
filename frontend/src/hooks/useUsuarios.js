import { useCallback, useEffect, useState } from 'react';
import { usuarioService } from '../services/usuarioService';

export function useUsuarios() {
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
  const [role, setRole] = useState('');
  const [ativo, setAtivo] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await usuarioService.listar({
        page,
        size: 15,
        role: role || undefined,
        ativo: ativo === '' ? undefined : ativo === 'true',
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [page, role, ativo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPage(0);
  }, [role, ativo]);

  return {
    data,
    loading,
    erro,
    page,
    setPage,
    role,
    setRole,
    ativo,
    setAtivo,
    recarregar: carregar,
  };
}