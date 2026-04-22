import { useEffect } from 'react';
import { AlertTriangle, SearchX } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { fetchBooks } from '../../store/booksSlice';
import {
  borrowBook,
  cancelReservation,
  reserveBook,
  returnBorrowedBook,
} from '../../store/loansSlice';
import { addWishlistItem, fetchWishlist, removeWishlistItem } from '../../store/wishlistSlice';
import { filterByCategory } from '../../utils/filterBooks';
import { sortByTitleAsc, sortByAuthorAsc, sortByYearDesc, sortByPopularityDesc } from '../../utils/sortBooks';
import type { LibraryBook } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookCard } from '../BookCard';
import './BookList.css';

function renderLoadingSkeletonGrid() {
  return (
    <div className="book-list__skeleton-grid" aria-label="Cargando libros..." role="status">
      {Array.from({ length: 12 }).map((_, skeletonIndex) => (
        <div key={skeletonIndex} className="book-card-skeleton">
          <div className="book-card-skeleton__cover" />
          <div className="book-card-skeleton__line book-card-skeleton__line--title" />
          <div className="book-card-skeleton__line book-card-skeleton__line--author" />
          <div className="book-card-skeleton__line book-card-skeleton__line--year" />
        </div>
      ))}
    </div>
  );
}

function renderEmptyResultsMessage(searchQuery: string) {
  return (
    <div className="book-list__empty-state" role="status">
      <SearchX className="book-list__empty-state-icon" aria-hidden="true" size={40} />
      <p className="book-list__empty-state-text">
        {searchQuery
          ? `No se encontraron libros para "${searchQuery}"`
          : 'No hay libros disponibles con los filtros seleccionados'}
      </p>
    </div>
  );
}

export function BookList() {
  const dispatch = useDispatch<AppDispatch>();
  const { username, token } = useAuth();
  const { books, searchQuery, filterCategory, sortCriterion, isLoading, errorMessage } = useSelector(
    (state: RootState) => state.books
  );
  const { items: wishlistItems } = useSelector((state: RootState) => state.wishlist);
  const { loans, reservations } = useSelector((state: RootState) => state.loans);
  const currentUserId = username ?? token ?? '';

  useEffect(() => {
    dispatch(fetchBooks(''));
  }, [dispatch]);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchWishlist(token));
  }, [dispatch, token]);

  let displayedBooks = filterByCategory(books, filterCategory);

  if (sortCriterion === 'title_asc') displayedBooks = sortByTitleAsc([...displayedBooks]);
  else if (sortCriterion === 'author_asc') displayedBooks = sortByAuthorAsc([...displayedBooks]);
  else if (sortCriterion === 'year_desc') displayedBooks = sortByYearDesc([...displayedBooks]);
  else displayedBooks = sortByPopularityDesc([...displayedBooks]);

  if (isLoading) {
    return renderLoadingSkeletonGrid();
  }

  if (errorMessage) {
    return (
      <div className="book-list__error-state" role="alert">
        <AlertTriangle className="book-list__error-icon" aria-hidden="true" size={40} />
        <p className="book-list__error-text">{errorMessage}</p>
      </div>
    );
  }

  if (displayedBooks.length === 0) {
    return renderEmptyResultsMessage(searchQuery);
  }

  const activeLoansByBookId = new Map(
    loans
      .filter(loan => !loan.returnedAt)
      .map(loan => [loan.bookId, loan] as const)
  );
  const reservationsByBookId = new Map<string, typeof reservations>();
  for (const reservation of reservations) {
    if (!reservationsByBookId.has(reservation.bookId)) {
      reservationsByBookId.set(reservation.bookId, []);
    }
    reservationsByBookId.get(reservation.bookId)!.push(reservation);
  }
  const wishlistBookIdSet = new Set(wishlistItems.map(item => item.bookId));

  function resolveBookAvailability(book: LibraryBook): LibraryBook {
    const activeLoan = activeLoansByBookId.get(book.bookId);
    return {
      ...book,
      availabilityStatus: activeLoan ? 'borrowed' : 'available',
    };
  }

  function formatDueDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <section aria-label={`${displayedBooks.length} libros encontrados`}>
      <p className="book-list__results-count">
        {displayedBooks.length} libro{displayedBooks.length !== 1 ? 's' : ''} encontrado{displayedBooks.length !== 1 ? 's' : ''}
      </p>
      <div className="book-list__grid">
        {displayedBooks.map(libraryBook => {
          const activeLoan = activeLoansByBookId.get(libraryBook.bookId);
          const queue = reservationsByBookId.get(libraryBook.bookId) ?? [];
          const currentReservationIndex = queue.findIndex(item => item.userId === currentUserId);
          const hasCurrentReservation = currentReservationIndex >= 0;
          const isBorrowedByCurrentUser = !!activeLoan && activeLoan.userId === currentUserId;

          return (
            <BookCard
              key={libraryBook.bookId}
              book={resolveBookAvailability(libraryBook)}
              loanDueDateLabel={activeLoan ? formatDueDate(activeLoan.dueAt) : undefined}
              isLoanOverdue={activeLoan ? new Date(activeLoan.dueAt) < new Date() : false}
              borrowedByUserName={activeLoan && !isBorrowedByCurrentUser ? activeLoan.userName : undefined}
              reservationCount={queue.length}
              reservationPosition={hasCurrentReservation ? currentReservationIndex + 1 : null}
              canBorrow={!activeLoan && (!queue.length || hasCurrentReservation)}
              canReturn={isBorrowedByCurrentUser}
              canReserve={!!activeLoan && !isBorrowedByCurrentUser}
              hasCurrentUserReservation={hasCurrentReservation}
              onBorrow={() =>
                dispatch(
                  borrowBook({
                    bookId: libraryBook.bookId,
                    bookTitle: libraryBook.bookTitle,
                    userId: currentUserId,
                    userName: username ?? 'Usuario',
                    loanDays: 14,
                  })
                )
              }
              onReturn={() =>
                dispatch(
                  returnBorrowedBook({
                    bookId: libraryBook.bookId,
                    userId: currentUserId,
                  })
                )
              }
              onReserve={() =>
                dispatch(
                  reserveBook({
                    bookId: libraryBook.bookId,
                    bookTitle: libraryBook.bookTitle,
                    userId: currentUserId,
                    userName: username ?? 'Usuario',
                  })
                )
              }
              onCancelReservation={() =>
                dispatch(
                  cancelReservation({
                    bookId: libraryBook.bookId,
                    userId: currentUserId,
                  })
                )
              }
              canAddToWishlist={!wishlistBookIdSet.has(libraryBook.bookId) && !!token}
              canRemoveFromWishlist={wishlistBookIdSet.has(libraryBook.bookId) && !!token}
              onAddToWishlist={() => {
                if (!token) return;
                dispatch(
                  addWishlistItem({
                    token,
                    book: {
                      bookId: libraryBook.bookId,
                      bookTitle: libraryBook.bookTitle,
                      authorName: libraryBook.authorNames[0] ?? 'Autor desconocido',
                      coverImageId: libraryBook.coverImageId,
                    },
                  })
                );
              }}
              onRemoveFromWishlist={() => {
                if (!token) return;
                dispatch(
                  removeWishlistItem({
                    token,
                    bookId: libraryBook.bookId,
                  })
                );
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
