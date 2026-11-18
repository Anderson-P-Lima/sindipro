import { useCallback, useEffect, useState } from 'react';
import { lancamentoService } from '../services/lancamentoService';

export function useLancamentos() {
  // Estrutura atualizada: 'page' guarda os dados da tabela (com paginação) e 'resumo' guarda os totais
  const [data, setData] = useState({ 
    page: { content: [], totalPages: 0, totalElements: 0, page: 0, last: true }, 
    resumo: { totalReceitas: 0, totalDespesas: 0, totalEmAberto: 0 } 
  });
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [page, setPage] = useState(0);
  const [tipo, setTipo] = useState('');
  const [status, setStatus] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resultado = await lancamentoService.listar({
        page,
        size: 15,
        tipo: tipo || undefined,
        status: status || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        descricao: descricao || undefined,
        categoria: categoria || undefined
      });
      setData(resultado);
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível carregar os lançamentos.');
    } finally {
      setLoading(false);
    }
  }, [page, tipo, status, dataInicio, dataFim, descricao, categoria]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    setPage(0);
  }, [tipo, status, dataInicio, dataFim, descricao, categoria]);

  return {
    data, loading, erro, page, setPage, tipo, setTipo, status, setStatus,
    dataInicio, setDataInicio, dataFim, setDataFim, descricao, setDescricao, categoria, setCategoria, recarregar: carregar,
  };
}