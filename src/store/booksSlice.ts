import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LibraryBook } from '../types';
import type { SortCriterion, FilterCategory } from '../utils/enums';
import { fetchDefaultLibraryCatalog, fetchBooksBySearchQuery } from '../api';

interface BooksState {
  books: LibraryBook[];
  searchQuery: string;
  filterCategory: FilterCategory;
  sortCriterion: SortCriterion;
  isLoading: boolean;
  errorMessage: string | null;
}

const initialState: BooksState = {
  books: [],
  searchQuery: '',
  filterCategory: 'all',
  sortCriterion: 'popularity_desc',
  isLoading: true,
  errorMessage: null,
};

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (query: string) => {
    const result = query.trim()
      ? await fetchBooksBySearchQuery(query)
      : await fetchDefaultLibraryCatalog();
    return result;
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setFilterCategory(state, action: PayloadAction<FilterCategory>) {
      state.filterCategory = action.payload;
    },
    setSortCriterion(state, action: PayloadAction<SortCriterion>) {
      state.sortCriterion = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state) => {
        state.isLoading = false;
        state.errorMessage = 'No se pudieron cargar los libros. Intenta de nuevo.';
      });
  },
});

export const { setSearchQuery, setFilterCategory, setSortCriterion } = booksSlice.actions;
export default booksSlice.reducer;
