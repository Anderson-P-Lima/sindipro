import { render, screen } from '@testing-library/react';
import EmptyState from '../../components/common/EmptyState';

describe('EmptyState', () => {
  it('renderiza título e descrição', () => {
    render(<EmptyState titulo="Nada aqui" descricao="Adicione algo" />);
    expect(screen.getByText('Nada aqui')).toBeInTheDocument();
    expect(screen.getByText('Adicione algo')).toBeInTheDocument();
  });

  it('renderiza ação quando fornecida', () => {
    render(
      <EmptyState titulo="X" acao={<button>Clique</button>} />
    );
    expect(screen.getByRole('button', { name: 'Clique' })).toBeInTheDocument();
  });

  it('usa role=status para acessibilidade', () => {
    render(<EmptyState titulo="X" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});