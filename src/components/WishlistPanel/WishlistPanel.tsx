import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store/store';
import { useAuth } from '../../context/AuthContext';
import { fetchWishlist, removeWishlistItem } from '../../store/wishlistSlice';
import './WishlistPanel.css';

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function WishlistPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useAuth();
  const { items, isLoading, errorMessage } = useSelector((state: RootState) => state.wishlist);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchWishlist(token));
  }, [dispatch, token]);

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
          {items.slice(0, 6).map(item => {
            const workId = item.bookId.replace('/works/', '');
            return (
              <li key={item.bookId} className="wishlist-panel__item">
                <div className="wishlist-panel__item-info">
                  <Link to={`/book/${workId}`} className="wishlist-panel__book-link">
                    {item.bookTitle}
                  </Link>
                  <span className="wishlist-panel__meta">
                    {item.authorName} · Agregado: {formatDate(item.addedAt)}
                  </span>
                </div>
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
