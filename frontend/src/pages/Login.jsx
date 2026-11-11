import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Login() {
  usePageTitle(
    'Entrar — SindiPro',
    'Acesse o sistema de gestão de condomínios SindiPro.'
  );

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(email.trim(), senha);
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Falha ao autenticar. Verifique e-mail e senha.';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-container bg-light">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="text-center mb-4">
          <i
            className="bi bi-building text-primary"
            style={{ fontSize: '3rem' }}
            aria-hidden="true"
          ></i>
          <h1 className="h3 mt-2 mb-1 fw-bold">SindiPro</h1>
          <p className="text-secondary">Sistema de Gestão de Condomínios</p>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <h2 className="h5 mb-3">Entrar</h2>

            {erro && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  aria-required="true"
                  disabled={carregando}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="senha" className="form-label">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  className="form-control"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  disabled={carregando}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={carregando}
              >
                {carregando ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
                    Entrar
                  </>
                )}
              </button>
            </form>

            <hr className="my-4" />

            <details>
              <summary
                className="text-secondary small"
                style={{ cursor: 'pointer' }}
              >
                Credenciais de teste (dev)
              </summary>
              <div className="small mt-2 text-secondary">
                <div><strong>Admin:</strong> admin@condominio.local / admin123</div>
                <div><strong>Síndico:</strong> sindico@condominio.local / sindico123</div>
                <div><strong>Morador:</strong> morador@condominio.local / morador123</div>
              </div>
            </details>
          </div>
        </div>

        <p className="text-center text-secondary small mt-4 mb-0">
          <Link to="/privacidade" className="text-decoration-none">
            Política de Privacidade
          </Link>
          <span className="mx-2">·</span>
          <Link to="/termos" className="text-decoration-none">
            Termos de Uso
          </Link>
        </p>
      </div>
    </div>
  );
}