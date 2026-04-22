import { useMemo, useState } from 'react';
import { Star, BookOpen, RotateCcw, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { useAuth } from '../../context/AuthContext';
import { completeAndReturnBorrowedBook, rateLoanBook } from '../../store/loansSlice';
import type { UserLoanRecord } from '../../types';
import './LoanDashboard.css';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function resolveBookRoute(bookId: string): string {
  return `/book/${bookId.replace('/works/', '')}`;
}

export function LoanDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { username, token } = useAuth();
  const currentUserId = username ?? token ?? '';
  const { loans, reservations } = useSelector((state: RootState) => state.loans);
  const [ratingLoanId, setRatingLoanId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);

  const activeLoans = useMemo(
    () =>
      loans
        .filter(loan => loan.userId === currentUserId && !loan.returnedAt)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [loans, currentUserId]
  );

  const userReservations = useMemo(
    () => reservations.filter(reservation => reservation.userId === currentUserId),
    [reservations, currentUserId]
  );

  const loanHistory = useMemo(
    () =>
      loans
        .filter(loan => loan.userId === currentUserId && !!loan.returnedAt)
        .sort((a, b) => new Date(b.returnedAt!).getTime() - new Date(a.returnedAt!).getTime())
        .slice(0, 6),
    [loans, currentUserId]
  );

  const ratingLoan = ratingLoanId
    ? activeLoans.find(loan => loan.loanId === ratingLoanId) ?? null
    : null;

  function openRatingModal(loan: UserLoanRecord) {
    setRatingLoanId(loan.loanId);
    setSelectedRating(loan.rating ?? 0);
  }

  function closeRatingModal() {
    setRatingLoanId(null);
    setSelectedRating(0);
  }

  function handleSaveRating() {
    if (!ratingLoan || selectedRating < 1 || selectedRating > 5) return;
    dispatch(
      rateLoanBook({
        loanId: ratingLoan.loanId,
        userId: currentUserId,
        rating: selectedRating,
      })
    );
    closeRatingModal();
  }

  function handleCompleteAndReturn(loanId: string) {
    dispatch(
      completeAndReturnBorrowedBook({
        loanId,
        userId: currentUserId,
      })
    );
  }

  return (
    <section className="loan-dashboard" aria-label="Resumen de préstamos">
      <header className="loan-dashboard__header">
        <h2 className="loan-dashboard__title">Mis préstamos y reservas</h2>
        <p className="loan-dashboard__subtitle">
          Préstamos activos: {activeLoans.length} · Reservas activas: {userReservations.length}
        </p>
      </header>

      <div className="loan-dashboard__grid">

        {/* ── Préstamos activos ── */}
        <article className="loan-dashboard__panel">
          <h3 className="loan-dashboard__panel-title">Préstamos activos</h3>

          {activeLoans.length === 0 ? (
            <p className="loan-dashboard__empty-text">No tienes préstamos activos.</p>
          ) : (
            <div className="loan-dashboard__scroll-area">
              {activeLoans.map(loan => {
                const isOverdue = new Date(loan.dueAt) < new Date();
                return (
                  <div key={loan.loanId} className="loan-dashboard__wide-card">
                    <div className="loan-dashboard__wide-card-header">
                      <h4 className="loan-dashboard__wide-card-title">
                        <Link className="loan-dashboard__book-link" to={resolveBookRoute(loan.bookId)}>
                          {loan.bookTitle}
                        </Link>
                      </h4>
                      <span
                        className={
                          isOverdue
                            ? 'loan-dashboard__date loan-dashboard__date--overdue'
                            : 'loan-dashboard__date'
                        }
                      >
                        {isOverdue
                          ? `Vencido: ${formatDate(loan.dueAt)}`
                          : `Vence: ${formatDate(loan.dueAt)}`}
                      </span>
                    </div>

                    {loan.rating && (
                      <span className="loan-dashboard__rating-badge">
                        <Star size={12} fill="currentColor" />
                        {loan.rating}/5
                      </span>
                    )}

                    <div className="loan-dashboard__wide-card-actions">
                      <button
                        type="button"
                        className="loan-dashboard__action-button loan-dashboard__action-button--secondary"
                        onClick={() => openRatingModal(loan)}
                        aria-label={`Calificar ${loan.bookTitle}`}
                      >
                        <Star size={13} />
                        Calificar
                      </button>

                      <button
                        type="button"
                        className="loan-dashboard__action-button"
                        onClick={() => handleCompleteAndReturn(loan.loanId)}
                        aria-label={`Marcar como completado y devolver ${loan.bookTitle}`}
                      >
                        <RotateCcw size={13} />
                        Completar y devolver
                      </button>

                      <Link
                        className="loan-dashboard__action-button loan-dashboard__action-button--secondary loan-dashboard__action-button--link"
                        to={resolveBookRoute(loan.bookId)}
                        aria-label={`Ver detalle de ${loan.bookTitle}`}
                      >
                        <Eye size={13} />
                        Ver libro
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        {/* ── Mis reservas ── */}
        <article className="loan-dashboard__panel">
          <h3 className="loan-dashboard__panel-title">Mis reservas</h3>

          {userReservations.length === 0 ? (
            <p className="loan-dashboard__empty-text">No tienes reservas activas.</p>
          ) : (
            <div className="loan-dashboard__scroll-area">
              {userReservations.map(reservation => (
                <div key={reservation.reservationId} className="loan-dashboard__item">
                  <strong>{reservation.bookTitle}</strong>
                  <span className="loan-dashboard__date">
                    Reservado: {formatDate(reservation.reservedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* ── Historial reciente ── */}
        <article className="loan-dashboard__panel">
          <h3 className="loan-dashboard__panel-title">Historial reciente</h3>

          {loanHistory.length === 0 ? (
            <p className="loan-dashboard__empty-text">No tienes devoluciones registradas.</p>
          ) : (
            <div className="loan-dashboard__scroll-area">
              {loanHistory.map(loan => (
                <div key={loan.loanId} className="loan-dashboard__item">
                  <strong>{loan.bookTitle}</strong>
                  <span className="loan-dashboard__date">
                    {loan.completedAt ? 'Leído y devuelto' : 'Devuelto'}: {formatDate(loan.returnedAt!)}
                  </span>
                  {loan.rating && (
                    <span className="loan-dashboard__rating-badge">
                      <Star size={11} fill="currentColor" />
                      {loan.rating}/5
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* ── Modal de calificación ── */}
      {ratingLoan && (
        <div
          className="loan-dashboard__modal-backdrop"
          role="presentation"
          onClick={closeRatingModal}
        >
          <div
            className="loan-dashboard__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loan-rating-title"
            onClick={event => event.stopPropagation()}
          >
            <h4 id="loan-rating-title" className="loan-dashboard__modal-title">
              Calificar libro
            </h4>
            <p className="loan-dashboard__modal-book-name">{ratingLoan.bookTitle}</p>

            <div className="loan-dashboard__star-row" aria-label="Calificación del libro">
              {[1, 2, 3, 4, 5].map(star => {
                const isFilled = star <= selectedRating;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`loan-dashboard__star-button ${isFilled ? 'loan-dashboard__star-button--active' : ''}`}
                    onClick={() => setSelectedRating(star)}
                    aria-label={`Seleccionar ${star} estrella${star === 1 ? '' : 's'}`}
                  >
                    <Star size={20} fill={isFilled ? 'currentColor' : 'none'} />
                  </button>
                );
              })}
            </div>

            <div className="loan-dashboard__modal-actions">
              <button
                type="button"
                className="loan-dashboard__action-button"
                onClick={handleSaveRating}
                disabled={selectedRating < 1}
              >
                Guardar calificación
              </button>
              <button
                type="button"
                className="loan-dashboard__action-button loan-dashboard__action-button--secondary"
                onClick={closeRatingModal}
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