export type AvailabilityStatus = 'available' | 'borrowed';
export type SortCriterion = 'title_asc' | 'author_asc' | 'year_desc' | 'popularity_desc';
export type FilterCategory = 'all' | 'fiction' | 'science' | 'history' | 'technology' | 'art' | 'biography' | 'drama';
export type ThemeMode = 'light' | 'dark';

export const SORT_OPTIONS: { value: SortCriterion; displayLabel: string }[] = [
  { value: 'popularity_desc', displayLabel: 'Popularidad' },
  { value: 'title_asc', displayLabel: 'Título A-Z' },
  { value: 'author_asc', displayLabel: 'Autor A-Z' },
  { value: 'year_desc', displayLabel: 'Más reciente' },
];

export const FILTER_CATEGORIES: { value: FilterCategory; displayLabel: string }[] = [
  { value: 'all', displayLabel: 'Todos' },
  { value: 'fiction', displayLabel: 'Ficción' },
  { value: 'science', displayLabel: 'Ciencia' },
  { value: 'history', displayLabel: 'Historia' },
  { value: 'technology', displayLabel: 'Tecnología' },
  { value: 'art', displayLabel: 'Arte' },
  { value: 'biography', displayLabel: 'Biografía' },
  { value: 'drama', displayLabel: 'Drama' },
];

export const BOOK_DEFAULTS = {
  title: 'Untitled',
  authors: ['Unknown Author'] as string[],
  coverImageId: null as number | null,
  subjects: [] as string[],
  year: null as number | null,
  editions: 0,
  availabilityStatus: 'available' as AvailabilityStatus,
};
