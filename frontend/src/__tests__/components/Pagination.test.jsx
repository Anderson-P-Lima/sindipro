import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../components/common/Pagination';

describe('Pagination', () => {
  it('não renderiza com 0 ou 1 página', () => {
    const { container } = render(<Pagination page={0} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza com 2+ páginas', () => {
    render(<Pagination page={0} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Paginação de comunicados')).toBeInTheDocument();
  });

  it('avança página ao clicar em próxima', async () => {
    const onChange = jest.fn();
    render(<Pagination page={0} totalPages={3} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText('Próxima página'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('desabilita voltar na primeira página', () => {
    render(<Pagination page={0} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
  });

  it('desabilita avançar na última página', () => {
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText('Próxima página')).toBeDisabled();
  });

  it('marca página atual com aria-current', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByText('2').closest('li')).toHaveClass('active');
  });
});