import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Página não encontrada — SindiPro');

  return (
    <div className="container py-5 text-center">
      <h1 className="display-3 fw-bold">404</h1>
      <p className="lead text-secondary">Página não encontrada.</p>
      <Link to="/dashboard" className="btn btn-primary">
        <i className="bi bi-house me-1" aria-hidden="true"></i>
        Voltar ao início
      </Link>
    </div>
  );
}