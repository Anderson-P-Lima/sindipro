import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function TermosUso() {
  usePageTitle(
    'Termos de Uso — SindiPro',
    'Termos e Condições de Uso do sistema SindiPro.'
  );

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <Link to="/login" className="text-decoration-none small">
        <i className="bi bi-arrow-left me-1" aria-hidden="true"></i> Voltar
      </Link>

      <h1 className="mt-3 mb-4">Termos e Condições de Uso</h1>
      <p className="text-secondary">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <h2 className="h5 mt-4">1. Aceitação</h2>
      <p>
        Ao acessar o SindiPro, o usuário concorda integralmente com estes
        termos.
      </p>

      <h2 className="h5 mt-4">2. Uso permitido</h2>
      <p>
        O sistema destina-se à gestão de condomínios residenciais. É vedado o
        uso para fins ilícitos, ofensivos ou que violem direitos de terceiros.
      </p>

      <h2 className="h5 mt-4">3. Responsabilidades do usuário</h2>
      <p>
        O usuário é responsável pela veracidade das informações fornecidas e
        pela guarda das suas credenciais de acesso.
      </p>

      <h2 className="h5 mt-4">4. Responsabilidades do sistema</h2>
      <p>
        Empregamos boas práticas de segurança, mas não nos responsabilizamos
        por indisponibilidades temporárias ou uso indevido por terceiros.
      </p>

      <h2 className="h5 mt-4">5. Propriedade intelectual</h2>
      <p>
        Marca, código e conteúdo são protegidos. Reprodução sem autorização é
        proibida.
      </p>

      <h2 className="h5 mt-4">6. Foro</h2>
      <p>
        Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da
        comarca do domicílio do usuário.
      </p>
    </div>
  );
}