import type { LibraryBook } from '../types';
import type { FilterCategory } from './enums';

export function filterByCategory(books: LibraryBook[], category: FilterCategory): LibraryBook[] {
  if (category === 'all') return books;
  return books.filter(book =>
    book.subjectCategories.some(subject =>
      subject.toLowerCase().includes(category.toLowerCase())
    )
  );
}
