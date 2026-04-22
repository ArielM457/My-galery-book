import { useState, memo } from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LibraryBook } from '../../types';
import { buildBookCoverImageUrl } from '../../api';
import './BookCard.css';

function resolveAvailabilityStatusDisplayText(status: LibraryBook['availabilityStatus']): string {
  return status === 'available' ? 'Disponible' : 'Prestado';
}

function formatAuthorNamesForDisplay(authorNames: string[]): string {
  if (authorNames.length === 0) return 'Autor desconocido';
  if (authorNames.length === 1) return authorNames[0];
  return `${authorNames[0]} y ${authorNames.length - 1} más`;
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
  onBorrow?: () => void;
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

  function handleCoverImageLoadError() {
    setHasCoverImageLoadFailed(true);
  }

  const shouldRenderCoverPlaceholder = !book.coverImageId || hasCoverImageLoadFailed;

  const workId = book.bookId.replace('/works/', '');

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
              <button type="button" className="book-card__loan-button" onClick={onBorrow}>
                Prestar 14 días
              </button>
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
