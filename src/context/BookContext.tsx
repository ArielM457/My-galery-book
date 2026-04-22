/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LibraryBook } from '../types';
import type { SortCriterion, FilterCategory } from '../utils/enums';
import { fetchDefaultLibraryCatalog, fetchBooksBySearchQuery } from '../api';
import { sortByTitleAsc, sortByAuthorAsc, sortByYearDesc, sortByPopularityDesc } from '../utils/sortBooks';
import { filterByCategory } from '../utils/filterBooks';

interface BookContextValue {
  displayedBookCollection: LibraryBook[];
  activeSearchQuery: string;
  activeFilterCategory: FilterCategory;
  activeSortCriterion: SortCriterion;
  isLoadingBookData: boolean;
  bookFetchErrorMessage: string | null;
  updateSearchQuery: (newQuery: string) => void;
  updateFilterCategory: (newCategory: FilterCategory) => void;
  updateSortCriterion: (newCriterion: SortCriterion) => void;
}

function applySortCriterionToBookCollection(
  bookCollection: LibraryBook[],
  sortCriterion: SortCriterion
): LibraryBook[] {
  const mutableBooksCopy = [...bookCollection];
  switch (sortCriterion) {
    case 'title_asc':
      return sortByTitleAsc(mutableBooksCopy);
    case 'author_asc':
      return sortByAuthorAsc(mutableBooksCopy);
    case 'year_desc':
      return sortByYearDesc(mutableBooksCopy);
    case 'popularity_desc':
      return sortByPopularityDesc(mutableBooksCopy);
    default:
      return mutableBooksCopy;
  }
}

function applyCategoryFilterToBookCollection(
  bookCollection: LibraryBook[],
  filterCategory: FilterCategory
): LibraryBook[] {
  return filterByCategory(bookCollection, filterCategory);
}

const BookContext = createContext<BookContextValue | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const [rawBookCollection, setRawBookCollection] = useState<LibraryBook[]>([]);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [activeFilterCategory, setActiveFilterCategory] = useState<FilterCategory>('all');
  const [activeSortCriterion, setActiveSortCriterion] = useState<SortCriterion>('popularity_desc');
  const [isLoadingBookData, setIsLoadingBookData] = useState(true);
  const [bookFetchErrorMessage, setBookFetchErrorMessage] = useState<string | null>(null);

  const displayedBookCollection = applySortCriterionToBookCollection(
    applyCategoryFilterToBookCollection(rawBookCollection, activeFilterCategory),
    activeSortCriterion
  );

  const loadBooksFromRemoteApi = useCallback(async (searchQuery: string) => {
    setIsLoadingBookData(true);
    setBookFetchErrorMessage(null);
    try {
      const fetchedBooks = searchQuery.trim()
        ? await fetchBooksBySearchQuery(searchQuery)
        : await fetchDefaultLibraryCatalog();
      setRawBookCollection(fetchedBooks);
    } catch {
      setBookFetchErrorMessage('No se pudieron cargar los libros. Intenta de nuevo.');
    } finally {
      setIsLoadingBookData(false);
    }
  }, []);

  useEffect(() => {
    loadBooksFromRemoteApi('');
  }, [loadBooksFromRemoteApi]);

  useEffect(() => {
    if (!activeSearchQuery.trim()) return;
    const searchDebounceTimer = setTimeout(() => {
      loadBooksFromRemoteApi(activeSearchQuery);
    }, 500);
    return () => clearTimeout(searchDebounceTimer);
  }, [activeSearchQuery, loadBooksFromRemoteApi]);

  function updateSearchQuery(newQuery: string) {
    setActiveSearchQuery(newQuery);
    if (!newQuery.trim()) {
      loadBooksFromRemoteApi('');
    }
  }

  function updateFilterCategory(newCategory: FilterCategory) {
    setActiveFilterCategory(newCategory);
  }

  function updateSortCriterion(newCriterion: SortCriterion) {
    setActiveSortCriterion(newCriterion);
  }

  return (
    <BookContext.Provider
      value={{
        displayedBookCollection,
        activeSearchQuery,
        activeFilterCategory,
        activeSortCriterion,
        isLoadingBookData,
        bookFetchErrorMessage,
        updateSearchQuery,
        updateFilterCategory,
        updateSortCriterion,
      }}
    >
      {children}
    </BookContext.Provider>
  );
}

export function useBookContext() {
  const contextValue = useContext(BookContext);
  if (!contextValue) {
    throw new Error('useBookContext must be used inside a BookProvider');
  }
  return contextValue;
}
