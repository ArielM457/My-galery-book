import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BookCard } from '../components/BookCard';
import type { LibraryBook } from '../types';

const mockBook: LibraryBook = {
  bookId: '/works/OL1234W',
  bookTitle: 'Clean Code',
  authorNames: ['Robert Martin'],
  coverImageId: null,
  subjectCategories: ['technology', 'programming'],
  firstPublishedYear: 2008,
  editionCount: 3,
  availabilityStatus: 'available',
};

const renderCard = (book: LibraryBook = mockBook) =>
  render(
    <MemoryRouter>
      <BookCard book={book} />
    </MemoryRouter>
  );

describe('BookCard', () => {
  it('renders ok', () => {
    renderCard();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Robert Martin')).toBeInTheDocument();
  });

  it('badge disponible', () => {
    renderCard();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
  });

  it('badge prestado', () => {
    renderCard({ ...mockBook, availabilityStatus: 'borrowed' });
    expect(screen.getByText('Prestado')).toBeInTheDocument();
  });

  it('placeholder sin portada', () => {
    renderCard();
    expect(screen.getByLabelText('Sin portada disponible')).toBeInTheDocument();
  });

  it('vemos si es funcional - img err', () => {
    renderCard({ ...mockBook, coverImageId: 123456 });
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByLabelText('Sin portada disponible')).toBeInTheDocument();
  });

  it('muestra año pub', () => {
    renderCard();
    expect(screen.getByText('2008')).toBeInTheDocument();
  });
});
