import type { LibraryBook } from '../types';

export function sortByTitleAsc(books: LibraryBook[]): LibraryBook[] {
  return books.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle));
}

export function sortByAuthorAsc(books: LibraryBook[]): LibraryBook[] {
  return books.sort((a, b) => {
    const authorA = a.authorNames[0] ?? '';
    const authorB = b.authorNames[0] ?? '';
    return authorA.localeCompare(authorB);
  });
}

export function sortByYearDesc(books: LibraryBook[]): LibraryBook[] {
  return books.sort((a, b) => (b.firstPublishedYear ?? 0) - (a.firstPublishedYear ?? 0));
}

export function sortByPopularityDesc(books: LibraryBook[]): LibraryBook[] {
  return books.sort((a, b) => b.editionCount - a.editionCount);
}
