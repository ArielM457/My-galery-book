import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { WishlistBook } from '../types';
import { fetchUserWishlist, addBookToWishlist, removeBookFromWishlist } from '../api';

interface WishlistState {
  items: WishlistBook[];
  isLoading: boolean;
  errorMessage: string | null;
}

interface AddWishlistPayload {
  token: string;
  book: Pick<WishlistBook, 'bookId' | 'bookTitle' | 'authorName' | 'coverImageId'>;
}

interface RemoveWishlistPayload {
  token: string;
  bookId: string;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  errorMessage: null,
};

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (token: string) => {
  return fetchUserWishlist(token);
});

export const addWishlistItem = createAsyncThunk(
  'wishlist/addWishlistItem',
  async ({ token, book }: AddWishlistPayload) => {
    return addBookToWishlist(token, book);
  }
);

export const removeWishlistItem = createAsyncThunk(
  'wishlist/removeWishlistItem',
  async ({ token, bookId }: RemoveWishlistPayload) => {
    return removeBookFromWishlist(token, bookId);
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist(state) {
      state.items = [];
      state.errorMessage = null;
      state.isLoading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWishlist.pending, state => {
        state.isLoading = true;
        state.errorMessage = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.errorMessage = action.error.message ?? 'No se pudo cargar la lista de deseos';
      })
      .addCase(addWishlistItem.pending, state => {
        state.errorMessage = null;
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(addWishlistItem.rejected, (state, action) => {
        state.errorMessage = action.error.message ?? 'No se pudo agregar el libro a la lista de deseos';
      })
      .addCase(removeWishlistItem.pending, state => {
        state.errorMessage = null;
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeWishlistItem.rejected, (state, action) => {
        state.errorMessage = action.error.message ?? 'No se pudo eliminar el libro de la lista de deseos';
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
