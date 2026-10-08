import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function PoliticaPrivacidade() {
  usePageTitle(
    'Política de Privacidade — SindiPro',
    'Política de Privacidade do sistema SindiPro, em conformidade com a LGPD.'
  );

  return (
    <div className="container py-5" style={{ maxWidth: 800 }}>
      <Link to="/login" className="text-decoration-none small">
        <i className="bi bi-arrow-left me-1" aria-hidden="true"></i> Voltar
      </Link>

      <h1 className="mt-3 mb-4">Política de Privacidade</h1>
      <p className="text-secondary">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <h2 className="h5 mt-4">1. Dados coletados</h2>
      <p>
        Coletamos apenas os dados necessários para o funcionamento do sistema:
        nome, e-mail, senha (armazenada com criptografia), CPF opcional,
        telefone e vínculo com unidade do condomínio.
      </p>

      <h2 className="h5 mt-4">2. Base legal (LGPD)</h2>
      <p>
        O tratamento de dados é realizado com base no consentimento do titular
        e no cumprimento de obrigações legais (Lei 13.709/2018).
      </p>

      <h2 className="h5 mt-4">3. Direitos do titular</h2>
      <p>
        O usuário pode solicitar acesso, correção, portabilidade ou exclusão
        dos seus dados a qualquer momento pelo e-mail{' '}
        <a href="mailto:dpo@sindipro.local">dpo@sindipro.local</a>.
      </p>

      <h2 className="h5 mt-4">4. Segurança</h2>
      <p>
        Adotamos HTTPS, senhas com BCrypt e controle de acesso baseado em
        perfis. Logs de auditoria registram ações sensíveis.
      </p>

      <h2 className="h5 mt-4">5. Compartilhamento</h2>
      <p>Não compartilhamos dados com terceiros para fins comerciais.</p>
    </div>
  );
}