import { useParams, Link, Outlet, useMatch } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { buildBookCoverImageUrl } from '../../api';
import './BookDetailPage.css';

interface OpenLibraryWorkDetail {
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
}

function resolveDescriptionText(description: OpenLibraryWorkDetail['description']): string {
  if (!description) return 'Sin descripción ni nada disponible.';
  if (typeof description === 'string') return description;
  return description.value;
}

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const reviewsRouteMatch = useMatch('/book/:bookId/reviews');
  const isOnReviewsRoute = reviewsRouteMatch !== null;

  const url = bookId ? `https://openlibrary.org/works/${bookId}.json` : null;
  const { data: workDetail, isLoading, error } = useFetch<OpenLibraryWorkDetail>(url);

  if (isLoading) {
    return (
      <main className="app-layout__main-content">
        <p className="book-detail__loading">Cargando detalle...</p>
      </main>
    );
  }

  if (error || !workDetail) {
    return (
      <main className="app-layout__main-content">
        <Link to="/" className="book-detail__back-link">
          <ArrowLeft aria-hidden="true" size={16} />
          Volver al catálogo
        </Link>
        <p className="book-detail__error">{error ?? 'Libro no encontrado.'}</p>
      </main>
    );
  }

  const coverImageId = workDetail.covers?.[0] ?? null;

  return (
    <main className="app-layout__main-content">
      <Link to="/" className="book-detail__back-link">
        <ArrowLeft aria-hidden="true" size={16} />
        Volver al catálogo
      </Link>

      <article className="book-detail">
        <div className="book-detail__cover-container">
          {coverImageId ? (
            <img
              className="book-detail__cover-image"
              src={buildBookCoverImageUrl(coverImageId, 'L')}
              alt={`Portada de ${workDetail.title}`}
            />
          ) : (
            <div className="book-detail__cover-placeholder">
              <BookOpen aria-hidden="true" size={56} />
            </div>
          )}
        </div>

        <div className="book-detail__info">
          <header className="book-detail__header">
            <h1 className="book-detail__title">{workDetail.title}</h1>
            {workDetail.first_publish_date && (
              <p className="book-detail__publish-date">
                Publicado: {workDetail.first_publish_date}
              </p>
            )}
          </header>

          <section className="book-detail__description-block" aria-label="Descripción del libro">
            <h2 className="book-detail__section-title">Descripción</h2>
            <p className="book-detail__description">
              {resolveDescriptionText(workDetail.description)}
            </p>
          </section>

          {workDetail.subjects && workDetail.subjects.length > 0 && (
            <section className="book-detail__subjects-block" aria-label="Temas relacionados">
              <h2 className="book-detail__section-title">Temas</h2>
              <ul className="book-detail__subjects">
                {workDetail.subjects.slice(0, 8).map((subject, index) => (
                  <li key={index} className="book-detail__subject-tag">
                    {subject}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="book-detail__tabs">
            {!isOnReviewsRoute ? (
              <Link to="reviews" className="book-detail__tab-link">
                Ver reseñas
              </Link>
            ) : (
              <Link to={`/book/${bookId}`} className="book-detail__tab-link book-detail__tab-link--active">
                Ocultar reseñas
              </Link>
            )}
          </nav>
        </div>
      </article>

      {/* Outlet renders the nested /reviews route here */}
      <Outlet />
    </main>
  );
}
