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
  
  // 1. O estado da busca fica aqui:
  const [busca, setBusca] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await usuarioService.listar({
        page,
        size: 15,
        role: role || undefined,
        ativo: ativo === '' ? undefined : ativo === 'true',
        busca: busca || undefined, // 2. Repassando para o service
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [page, role, ativo, busca]); // 3. Adicionar 'busca' nas dependências

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPage(0);
  }, [role, ativo, busca]);

  return {
    data, loading, erro, page, setPage, role, setRole, ativo, setAtivo, 
    busca, setBusca, // 4. Retornando para a tela usar
    recarregar: carregar,
  };
}