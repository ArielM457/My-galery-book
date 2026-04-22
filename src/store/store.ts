import { configureStore } from '@reduxjs/toolkit';
import booksReducer from './booksSlice';
import loansReducer from './loansSlice';
import wishlistReducer from './wishlistSlice';

export const store = configureStore({
  reducer: {
    books: booksReducer,
    loans: loansReducer,
    wishlist: wishlistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
