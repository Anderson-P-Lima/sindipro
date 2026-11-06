import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza campos de email e senha', () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('campos têm aria-required', () => {
    renderLogin();
    expect(screen.getByLabelText(/e-mail/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/senha/i)).toHaveAttribute('aria-required', 'true');
  });

  it('exibe credenciais de teste no details', () => {
    renderLogin();
    expect(screen.getByText(/credenciais de teste/i)).toBeInTheDocument();
  });

  it('renderiza links de privacidade e termos', () => {
    renderLogin();
    expect(screen.getByText(/política de privacidade/i)).toBeInTheDocument();
    expect(screen.getByText(/termos de uso/i)).toBeInTheDocument();
  });

  it('exibe erro quando credenciais são inválidas', async () => {
    const { authService } = require('../../services/authService');
    authService.login = jest.fn().mockRejectedValue({
      response: { data: { message: 'E-mail ou senha inválidos' } },
    });

    renderLogin();

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'errado@teste.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'senhaerrada');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(
      await screen.findByText(/e-mail ou senha inválidos/i)
    ).toBeInTheDocument();
  });

  it('chama login e redireciona em caso de sucesso', async () => {
    const { authService } = require('../../services/authService');
    authService.login = jest.fn().mockResolvedValue({
      token: 'jwt-abc',
      id: 1,
      nome: 'Admin',
      email: 'admin@teste.com',
      role: 'ADMIN_SISTEMA',
    });

    renderLogin();

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'admin@teste.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin@teste.com', 'admin123');
    });
  });
});