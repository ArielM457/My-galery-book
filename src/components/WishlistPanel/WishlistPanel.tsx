import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store/store';
import { useAuth } from '../../context/AuthContext';
import { fetchWishlist, removeWishlistItem } from '../../store/wishlistSlice';
import { borrowBook } from '../../store/loansSlice';
import type { WishlistBook } from '../../types';
import './WishlistPanel.css';

const MAX_LOAN_DAYS = 28;
const DEFAULT_LOAN_DAYS = 14;

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number): Date {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function parseDateInputValue(dateValue: string): Date | null {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) return null;

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
}

function resolveLoanDaysFromDate(dateValue: string): number | null {
  const selectedDate = parseDateInputValue(dateValue);
  if (!selectedDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((selectedDate.getTime() - today.getTime()) / msPerDay);
}

export function WishlistPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, username } = useAuth();
  const { items, isLoading, errorMessage } = useSelector((state: RootState) => state.wishlist);
  const { loans, reservations } = useSelector((state: RootState) => state.loans);
  const currentUserId = username ?? token ?? '';

  const [borrowingItem, setBorrowingItem] = useState<WishlistBook | null>(null);
  const defaultDueDateValue = formatDateForInput(addDays(new Date(), DEFAULT_LOAN_DAYS));
  const [selectedDueDate, setSelectedDueDate] = useState(defaultDueDateValue);

  const todayDateValue = formatDateForInput(new Date());
  const maxLoanDateValue = formatDateForInput(addDays(new Date(), MAX_LOAN_DAYS));

  useEffect(() => {
    if (!token) return;
    dispatch(fetchWishlist(token));
  }, [dispatch, token]);

  const activeLoansByBookId = useMemo(
    () => new Map(loans.filter(loan => !loan.returnedAt).map(loan => [loan.bookId, loan] as const)),
    [loans]
  );

  const reservationsByBookId = useMemo(() => {
    const mappedReservations = new Map<string, typeof reservations>();
    for (const reservation of reservations) {
      if (!mappedReservations.has(reservation.bookId)) {
        mappedReservations.set(reservation.bookId, []);
      }
      mappedReservations.get(reservation.bookId)!.push(reservation);
    }
    return mappedReservations;
  }, [reservations]);

  const selectedLoanDays = resolveLoanDaysFromDate(selectedDueDate);
  const isSelectedDateInvalid =
    selectedLoanDays === null || selectedLoanDays < 0 || selectedLoanDays > MAX_LOAN_DAYS;

  function closeBorrowPopup() {
    setBorrowingItem(null);
    setSelectedDueDate(defaultDueDateValue);
  }

  function handleConfirmBorrow() {
    if (
      !borrowingItem ||
      selectedLoanDays === null ||
      selectedLoanDays < 0 ||
      selectedLoanDays > MAX_LOAN_DAYS
    ) {
      return;
    }

    dispatch(
      borrowBook({
        bookId: borrowingItem.bookId,
        bookTitle: borrowingItem.bookTitle,
        userId: currentUserId,
        userName: username ?? 'Usuario',
        loanDays: selectedLoanDays,
      })
    );

    closeBorrowPopup();
  }

  return (
    <section className="wishlist-panel" aria-label="Lista de deseos">
      <header className="wishlist-panel__header">
        <h2 className="wishlist-panel__title">Lista de deseos</h2>
        <p className="wishlist-panel__subtitle">
          {items.length} libro{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''} para leer después
        </p>
      </header>

      {isLoading && <p className="wishlist-panel__state">Cargando lista de deseos...</p>}
      {!isLoading && errorMessage && <p className="wishlist-panel__state wishlist-panel__state--error">{errorMessage}</p>}

      {!isLoading && !errorMessage && items.length === 0 && (
        <p className="wishlist-panel__state">Aún no tienes libros en tu lista de deseos.</p>
      )}

      {!isLoading && !errorMessage && items.length > 0 && (
        <ul className="wishlist-panel__list">
          {items.map(item => {
            const workId = item.bookId.replace('/works/', '');
            const activeLoan = activeLoansByBookId.get(item.bookId);
            const isAvailable = !activeLoan;

            const queue = reservationsByBookId.get(item.bookId) ?? [];
            const currentReservationIndex = queue.findIndex(reservation => reservation.userId === currentUserId);
            const hasCurrentReservation = currentReservationIndex >= 0;
            const canBorrow = isAvailable && (!queue.length || hasCurrentReservation);

            return (
              <li key={item.bookId} className="wishlist-panel__item">
                <div className="wishlist-panel__book-column">
                  <Link to={`/book/${workId}`} className="wishlist-panel__book-link">
                    {item.bookTitle}
                  </Link>
                  <span className="wishlist-panel__meta">
                    {item.authorName} · Agregado: {formatDate(item.addedAt)}
                  </span>
                </div>

                <div className="wishlist-panel__action-row">
                  <button
                    type="button"
                    className={`wishlist-panel__status-button ${isAvailable ? 'wishlist-panel__status-button--available' : 'wishlist-panel__status-button--borrowed'}`}
                    disabled
                  >
                    {isAvailable ? 'Disponible' : 'Prestado'}
                  </button>

                  <button
                    type="button"
                    className="wishlist-panel__borrow-button"
                    onClick={() => setBorrowingItem(item)}
                    disabled={!canBorrow}
                  >
                    Prestar libro
                  </button>

                  <button
                    type="button"
                    className="wishlist-panel__remove-button"
                    onClick={() => {
                      if (!token) return;
                      dispatch(removeWishlistItem({ token, bookId: item.bookId }));
                    }}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {borrowingItem && (
        <div className="wishlist-panel__modal-backdrop" role="presentation" onClick={closeBorrowPopup}>
          <div
            className="wishlist-panel__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-borrow-title"
            onClick={event => event.stopPropagation()}
          >
            <h3 id="wishlist-borrow-title" className="wishlist-panel__modal-title">
              Hacer préstamo
            </h3>
            <p className="wishlist-panel__modal-book-name">{borrowingItem.bookTitle}</p>
            <p className="wishlist-panel__modal-help">
              Elige una fecha de devolución desde hoy hasta {MAX_LOAN_DAYS} días.
            </p>

            <label className="wishlist-panel__modal-label" htmlFor="wishlist-loan-date">
              Fecha de devolución
            </label>
            <input
              id="wishlist-loan-date"
              className="wishlist-panel__modal-date-input"
              type="date"
              min={todayDateValue}
              max={maxLoanDateValue}
              value={selectedDueDate}
              onChange={event => setSelectedDueDate(event.target.value)}
            />

            <p className="wishlist-panel__modal-help">
              Duración seleccionada: {selectedLoanDays ?? 0} día{selectedLoanDays === 1 ? '' : 's'}.
            </p>

            <div className="wishlist-panel__modal-actions">
              <button
                type="button"
                className="wishlist-panel__borrow-button"
                onClick={handleConfirmBorrow}
                disabled={isSelectedDateInvalid}
              >
                Confirmar préstamo
              </button>
              <button
                type="button"
                className="wishlist-panel__remove-button"
                onClick={closeBorrowPopup}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
