import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { BookReservation, UserLoanRecord } from '../types';

const LOANS_STORAGE_KEY = 'julibrary-loans-state';
const DEFAULT_LOAN_DAYS = 14;
const MIN_LOAN_DAYS = 0;
const MAX_LOAN_DAYS = 28;

interface LoansState {
  loans: UserLoanRecord[];
  reservations: BookReservation[];
}

interface BorrowBookPayload {
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  loanDays?: number;
}

interface ReturnBookPayload {
  bookId: string;
  userId: string;
}

interface ReserveBookPayload {
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
}

interface CancelReservationPayload {
  bookId: string;
  userId: string;
}

interface CompleteAndReturnBookPayload {
  loanId: string;
  userId: string;
}

interface RateLoanBookPayload {
  loanId: string;
  userId: string;
  rating: number;
}

function buildRecordId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistLoansState(state: LoansState) {
  localStorage.setItem(LOANS_STORAGE_KEY, JSON.stringify(state));
}

function loadPersistedLoansState(): LoansState {
  const rawState = localStorage.getItem(LOANS_STORAGE_KEY);
  if (!rawState) {
    return { loans: [], reservations: [] };
  }

  try {
    const parsedState = JSON.parse(rawState) as Partial<LoansState>;
    const normalizedLoans = Array.isArray(parsedState.loans)
      ? parsedState.loans.map(loan => ({
        ...loan,
        completedAt: loan?.completedAt ?? null,
        rating: typeof loan?.rating === 'number' ? loan.rating : null,
      }))
      : [];

    return {
      loans: normalizedLoans,
      reservations: Array.isArray(parsedState.reservations) ? parsedState.reservations : [],
    };
  } catch (error) {
    console.error('No se pudo restaurar el estado de préstamos:', error);
    localStorage.removeItem(LOANS_STORAGE_KEY);
    return { loans: [], reservations: [] };
  }
}

const initialState: LoansState = loadPersistedLoansState();

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    borrowBook(state, action: PayloadAction<BorrowBookPayload>) {
      const { bookId, bookTitle, userId, userName, loanDays = DEFAULT_LOAN_DAYS } = action.payload;
      const activeLoan = state.loans.find(loan => loan.bookId === bookId && !loan.returnedAt);
      if (activeLoan) return;

      const bookReservations = state.reservations.filter(reservation => reservation.bookId === bookId);
      if (bookReservations.length > 0 && bookReservations[0].userId !== userId) return;

      state.reservations = state.reservations.filter(
        reservation => !(reservation.bookId === bookId && reservation.userId === userId)
      );

      const borrowedAt = new Date();
      const dueDate = new Date(borrowedAt);
      const parsedLoanDays = Number.isFinite(loanDays) ? Math.floor(loanDays) : DEFAULT_LOAN_DAYS;
      const safeLoanDays = Math.min(MAX_LOAN_DAYS, Math.max(MIN_LOAN_DAYS, parsedLoanDays));
      dueDate.setDate(dueDate.getDate() + safeLoanDays);

      state.loans.push({
        loanId: buildRecordId('loan'),
        bookId,
        bookTitle,
        userId,
        userName,
        borrowedAt: borrowedAt.toISOString(),
        dueAt: dueDate.toISOString(),
        returnedAt: null,
        completedAt: null,
        rating: null,
      });

      persistLoansState(state);
    },
    returnBorrowedBook(state, action: PayloadAction<ReturnBookPayload>) {
      const { bookId, userId } = action.payload;
      const activeLoan = state.loans.find(
        loan => loan.bookId === bookId && loan.userId === userId && !loan.returnedAt
      );
      if (!activeLoan) return;

      activeLoan.returnedAt = new Date().toISOString();
      persistLoansState(state);
    },
    reserveBook(state, action: PayloadAction<ReserveBookPayload>) {
      const { bookId, bookTitle, userId, userName } = action.payload;
      const activeLoan = state.loans.find(loan => loan.bookId === bookId && !loan.returnedAt);
      if (!activeLoan || activeLoan.userId === userId) return;

      const alreadyReserved = state.reservations.some(
        reservation => reservation.bookId === bookId && reservation.userId === userId
      );
      if (alreadyReserved) return;

      state.reservations.push({
        reservationId: buildRecordId('reservation'),
        bookId,
        bookTitle,
        userId,
        userName,
        reservedAt: new Date().toISOString(),
      });

      persistLoansState(state);
    },
    cancelReservation(state, action: PayloadAction<CancelReservationPayload>) {
      const { bookId, userId } = action.payload;
      const previousLength = state.reservations.length;
      state.reservations = state.reservations.filter(
        reservation => !(reservation.bookId === bookId && reservation.userId === userId)
      );
      if (state.reservations.length === previousLength) return;
      persistLoansState(state);
    },
    completeAndReturnBorrowedBook(state, action: PayloadAction<CompleteAndReturnBookPayload>) {
      const { loanId, userId } = action.payload;
      const activeLoan = state.loans.find(
        loan => loan.loanId === loanId && loan.userId === userId && !loan.returnedAt
      );
      if (!activeLoan) return;

      const now = new Date().toISOString();
      activeLoan.returnedAt = now;
      activeLoan.completedAt = now;
      persistLoansState(state);
    },
    rateLoanBook(state, action: PayloadAction<RateLoanBookPayload>) {
      const { loanId, userId, rating } = action.payload;
      const loan = state.loans.find(existingLoan => existingLoan.loanId === loanId && existingLoan.userId === userId);
      if (!loan) return;

      const safeRating = Math.min(5, Math.max(1, Math.floor(rating)));
      loan.rating = safeRating;
      persistLoansState(state);
    },
  },
});

export const {
  borrowBook,
  returnBorrowedBook,
  reserveBook,
  cancelReservation,
  completeAndReturnBorrowedBook,
  rateLoanBook,
} = loansSlice.actions;
export default loansSlice.reducer;
