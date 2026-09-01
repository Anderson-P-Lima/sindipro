import { useState } from 'react';
import './Login.css';
import fundoTest from '../../assets/images/Fundo_test.png';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login com:', email, senha);
  };

  return (
    <main className="login-page" aria-label="Página de login">
      <div className="login-image">
        <img src={fundoTest} alt="Fachada do condomínio" />
      </div>
      <div className="login-form-wrapper">
        <div className="modal-header">
          <img src="" alt="Logomarca da empresa NONONO" />
          <h1 id="login-title">Bem-vindo ao sistema do condomínio</h1>
        </div>
        <form
          className="login-form"
          id="form-login"
          onSubmit={handleSubmit}
          aria-labelledby="login-title"
        >
          <div className="form-group">
            <label htmlFor="email">Usuário</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn-submit" type="submit">Entrar</button>
        </form>
        <div className="modal-footer">
          <p className="access-label">Acessar como:</p>
          <div className="access-buttons">
            <button
              type="button"
              className="btn-access btn-resident"
              aria-label="Acesso para moradores"
            >
              Morador
            </button>
            <button
              type="button"
              className="btn-access btn-staff"
              aria-label="Acesso para administração e funcionários"
            >
              Administração
            </button>
            <button
              type="button"
              className="btn-access btn-company"
              aria-label="Acesso para empresa mantenedora"
            >
              Empresa
            </button>
          </div>
          <a href="#" className="forgot-password">Esqueci minha senha</a>
        </div>
      </div>
    </main>
  );
}

export default Login;