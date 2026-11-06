import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

jest.mock('../../services/authService');

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('começa deslogado após loading', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login salva token e user no localStorage', async () => {
    authService.login.mockResolvedValue({
      token: 'jwt-abc',
      id: 1,
      nome: 'Admin',
      email: 'admin@teste.com',
      role: 'ADMIN_SISTEMA',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login('admin@teste.com', 'senha');
    });

    expect(result.current.user.email).toBe('admin@teste.com');
    expect(localStorage.getItem('@sindipro:token')).toBe('jwt-abc');
  });

  it('logout limpa estado e localStorage', async () => {
    authService.login.mockResolvedValue({
      token: 'jwt', id: 1, nome: 'X', email: 'x@x.com', role: 'MORADOR',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => await result.current.login('x@x.com', '123'));

    act(() => result.current.logout());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('@sindipro:token')).toBeNull();
  });

  it('restaura usuário do localStorage na montagem', async () => {
    localStorage.setItem('@sindipro:token', 'jwt-existente');
    localStorage.setItem(
      '@sindipro:user',
      JSON.stringify({ id: 1, nome: 'Restaurado', email: 'r@r.com', role: 'MORADOR' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user.nome).toBe('Restaurado');
  });

  it('useAuth fora do provider lança erro', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      /useAuth deve ser usado dentro de AuthProvider/
    );
    spy.mockRestore();
  });
});