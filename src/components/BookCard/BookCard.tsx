import { useState, memo } from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LibraryBook } from '../../types';
import { buildBookCoverImageUrl } from '../../api';
import './BookCard.css';

const MAX_LOAN_DAYS = 28;
const DEFAULT_LOAN_DAYS = 14;

function resolveAvailabilityStatusDisplayText(status: LibraryBook['availabilityStatus']): string {
  return status === 'available' ? 'Disponible' : 'Prestado';
}

function formatAuthorNamesForDisplay(authorNames: string[]): string {
  if (authorNames.length === 0) return 'Autor desconocido';
  if (authorNames.length === 1) return authorNames[0];
  return `${authorNames[0]} y ${authorNames.length - 1} más`;
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

interface BookCardProps {
  book: LibraryBook;
  loanDueDateLabel?: string;
  isLoanOverdue?: boolean;
  borrowedByUserName?: string;
  reservationCount?: number;
  reservationPosition?: number | null;
  canBorrow?: boolean;
  canReserve?: boolean;
  canReturn?: boolean;
  hasCurrentUserReservation?: boolean;
  onBorrow?: (loanDays: number) => void;
  onReserve?: () => void;
  onReturn?: () => void;
  onCancelReservation?: () => void;
  canAddToWishlist?: boolean;
  canRemoveFromWishlist?: boolean;
  onAddToWishlist?: () => void;
  onRemoveFromWishlist?: () => void;
}

export const BookCard = memo(function BookCard({
  book,
  loanDueDateLabel,
  isLoanOverdue = false,
  borrowedByUserName,
  reservationCount = 0,
  reservationPosition = null,
  canBorrow = false,
  canReserve = false,
  canReturn = false,
  hasCurrentUserReservation = false,
  onBorrow,
  onReserve,
  onReturn,
  onCancelReservation,
  canAddToWishlist = false,
  canRemoveFromWishlist = false,
  onAddToWishlist,
  onRemoveFromWishlist,
}: BookCardProps) {
  const [hasCoverImageLoadFailed, setHasCoverImageLoadFailed] = useState(false);
  const [isBorrowCalendarOpen, setIsBorrowCalendarOpen] = useState(false);

  const todayDateValue = formatDateForInput(new Date());
  const maxLoanDateValue = formatDateForInput(addDays(new Date(), MAX_LOAN_DAYS));
  const defaultDueDateValue = formatDateForInput(addDays(new Date(), DEFAULT_LOAN_DAYS));
  const [selectedDueDate, setSelectedDueDate] = useState(defaultDueDateValue);

  function handleCoverImageLoadError() {
    setHasCoverImageLoadFailed(true);
  }

  function handleBorrowClick() {
    if (!onBorrow) return;

    const selectedLoanDays = resolveLoanDaysFromDate(selectedDueDate);
    if (selectedLoanDays === null || selectedLoanDays < 0 || selectedLoanDays > MAX_LOAN_DAYS) return;

    onBorrow(selectedLoanDays);
    setIsBorrowCalendarOpen(false);
    setSelectedDueDate(defaultDueDateValue);
  }

  const selectedLoanDays = resolveLoanDaysFromDate(selectedDueDate);
  const isSelectedDateInvalid =
    selectedLoanDays === null || selectedLoanDays < 0 || selectedLoanDays > MAX_LOAN_DAYS;

  const shouldRenderCoverPlaceholder = !book.coverImageId || hasCoverImageLoadFailed;

  const workId = book.bookId.replace('/works/', '');
  const dueDateInputId = `loan-date-${workId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  return (
    <article className="book-card">
      <div className="book-card__cover-container">
        {shouldRenderCoverPlaceholder ? (
          <div className="book-card__cover-placeholder" aria-label="Sin portada disponible">
            <BookOpen className="book-card__cover-placeholder-icon" aria-hidden="true" size={40} />
          </div>
        ) : (
          <img
            className="book-card__cover-image"
            src={buildBookCoverImageUrl(book.coverImageId!, 'M')}
            alt={`Portada de ${book.bookTitle}`}
            onError={handleCoverImageLoadError}
            loading="lazy"
          />
        )}
        <span
          className={`book-card__availability-badge book-card__availability-badge--${book.availabilityStatus}`}
          aria-label={`Estado: ${resolveAvailabilityStatusDisplayText(book.availabilityStatus)}`}
        >
          {resolveAvailabilityStatusDisplayText(book.availabilityStatus)}
        </span>
      </div>
      <div className="book-card__info-section">
        <h2 className="book-card__title" title={book.bookTitle}>
          <Link to={`/book/${workId}`} className="book-card__title-link">
            {book.bookTitle}
          </Link>
        </h2>
        <p className="book-card__author-name">
          {formatAuthorNamesForDisplay(book.authorNames)}
        </p>
        {book.firstPublishedYear && (
          <p className="book-card__publication-year">{book.firstPublishedYear}</p>
        )}
        {book.subjectCategories.length > 0 && (
          <ul className="book-card__subject-tags" aria-label="Categorías">
            {book.subjectCategories.slice(0, 3).map(subject => (
              <li key={subject} className="book-card__subject-tag">
                {subject}
              </li>
            ))}
          </ul>
        )}
        {(canBorrow || canReserve || canReturn || hasCurrentUserReservation) && (
          <div className="book-card__loan-actions">
            {canReturn && loanDueDateLabel && (
              <p
                className={`book-card__loan-status ${isLoanOverdue ? 'book-card__loan-status--overdue' : ''}`}
              >
                {isLoanOverdue ? `Vencido desde: ${loanDueDateLabel}` : `Vence: ${loanDueDateLabel}`}
              </p>
            )}

            {!canReturn && borrowedByUserName && (
              <p className="book-card__loan-status">Prestado por: {borrowedByUserName}</p>
            )}

            {hasCurrentUserReservation && reservationPosition !== null && (
              <p className="book-card__loan-status">
                Tu reserva está en posición #{reservationPosition}
              </p>
            )}

            {!hasCurrentUserReservation && canReserve && reservationCount > 0 && (
              <p className="book-card__loan-status">
                {reservationCount} reserva{reservationCount !== 1 ? 's' : ''} en cola
              </p>
            )}

            {canBorrow && (
              <>
                {!isBorrowCalendarOpen && (
                  <button
                    type="button"
                    className="book-card__loan-button"
                    onClick={() => setIsBorrowCalendarOpen(true)}
                  >
                    Hacer Prestamo
                  </button>
                )}

                {isBorrowCalendarOpen && (
                  <>
                    <p className="book-card__loan-help-text">
                      Elige una fecha de devolución desde hoy hasta {MAX_LOAN_DAYS} días.
                    </p>
                    <label className="book-card__loan-date-label" htmlFor={dueDateInputId}>
                      Fecha de devolución
                    </label>
                    <input
                      id={dueDateInputId}
                      className="book-card__loan-date-input"
                      type="date"
                      min={todayDateValue}
                      max={maxLoanDateValue}
                      value={selectedDueDate}
                      onChange={event => setSelectedDueDate(event.target.value)}
                    />
                    <p className="book-card__loan-help-text">
                      Duración seleccionada: {selectedLoanDays ?? 0} día{selectedLoanDays === 1 ? '' : 's'}.
                    </p>
                    <div className="book-card__loan-action-row">
                      <button
                        type="button"
                        className="book-card__loan-button"
                        onClick={handleBorrowClick}
                        disabled={isSelectedDateInvalid}
                      >
                        Confirmar préstamo
                      </button>
                      <button
                        type="button"
                        className="book-card__loan-button book-card__loan-button--secondary"
                        onClick={() => setIsBorrowCalendarOpen(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {canReturn && (
              <button
                type="button"
                className="book-card__loan-button book-card__loan-button--secondary"
                onClick={onReturn}
              >
                Devolver libro
              </button>
            )}

            {canReserve && !hasCurrentUserReservation && (
              <button
                type="button"
                className="book-card__loan-button book-card__loan-button--secondary"
                onClick={onReserve}
              >
                Reservar libro
              </button>
            )}

            {hasCurrentUserReservation && (
              <button
                type="button"
                className="book-card__loan-button book-card__loan-button--secondary"
                onClick={onCancelReservation}
              >
                Cancelar reserva
              </button>
            )}
          </div>
        )}
        {(canAddToWishlist || canRemoveFromWishlist) && (
          <div className="book-card__wishlist-actions">
            {canAddToWishlist && (
              <button
                type="button"
                className="book-card__wishlist-button"
                onClick={onAddToWishlist}
              >
                Agregar a deseos
              </button>
            )}
            {canRemoveFromWishlist && (
              <button
                type="button"
                className="book-card__wishlist-button book-card__wishlist-button--active"
                onClick={onRemoveFromWishlist}
              >
                Quitar de deseos
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
});
