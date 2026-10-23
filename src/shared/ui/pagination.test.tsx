import { render, screen } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('disables Previous on the first page and Next on the last one', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    rerender(<Pagination page={3} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
