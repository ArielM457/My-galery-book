import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useAuth } from '../../context/AuthContext';
import './LoanDashboard.css';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function LoanDashboard() {
  const { username, token } = useAuth();
  const currentUserId = username ?? token ?? '';
  const { loans, reservations } = useSelector((state: RootState) => state.loans);

  const activeLoans = useMemo(
    () => loans.filter(loan => loan.userId === currentUserId && !loan.returnedAt),
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

  return (
    <section className="loan-dashboard" aria-label="Resumen de préstamos">
      <header className="loan-dashboard__header">
        <h2 className="loan-dashboard__title">Mis préstamos y reservas</h2>
        <p className="loan-dashboard__subtitle">
          Préstamos activos: {activeLoans.length} · Reservas activas: {userReservations.length}
        </p>
      </header>

      <div className="loan-dashboard__grid">
        <article className="loan-dashboard__panel">
          <h3 className="loan-dashboard__panel-title">Préstamos activos</h3>
          {activeLoans.length === 0 ? (
            <p className="loan-dashboard__empty-text">No tienes préstamos activos.</p>
          ) : (
            <ul className="loan-dashboard__list">
              {activeLoans.map(loan => {
                const isOverdue = new Date(loan.dueAt) < new Date();
                return (
                  <li key={loan.loanId} className="loan-dashboard__item">
                    <strong>{loan.bookTitle}</strong>
                    <span className={isOverdue ? 'loan-dashboard__date loan-dashboard__date--overdue' : 'loan-dashboard__date'}>
                      {isOverdue
                        ? `Vencido: ${formatDate(loan.dueAt)}`
                        : `Vence: ${formatDate(loan.dueAt)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="loan-dashboard__panel">
          <h3 className="loan-dashboard__panel-title">Mis reservas</h3>
          {userReservations.length === 0 ? (
            <p className="loan-dashboard__empty-text">No tienes reservas activas.</p>
          ) : (
            <ul className="loan-dashboard__list">
              {userReservations.map(reservation => (
                <li key={reservation.reservationId} className="loan-dashboard__item">
                  <strong>{reservation.bookTitle}</strong>
                  <span className="loan-dashboard__date">Reservado: {formatDate(reservation.reservedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="loan-dashboard__panel">
          <h3 className="loan-dashboard__panel-title">Historial reciente</h3>
          {loanHistory.length === 0 ? (
            <p className="loan-dashboard__empty-text">No tienes devoluciones registradas.</p>
          ) : (
            <ul className="loan-dashboard__list">
              {loanHistory.map(loan => (
                <li key={loan.loanId} className="loan-dashboard__item">
                  <strong>{loan.bookTitle}</strong>
                  <span className="loan-dashboard__date">
                    Devuelto: {formatDate(loan.returnedAt!)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
