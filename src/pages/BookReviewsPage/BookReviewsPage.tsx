import { useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import './BookReviewsPage.css';

interface MockReview {
  id: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
}

const MOCK_REVIEWS_BY_BOOK: Record<string, MockReview[]> = {};

function generateMockReviewsForBook(bookId: string): MockReview[] {
  if (MOCK_REVIEWS_BY_BOOK[bookId]) return MOCK_REVIEWS_BY_BOOK[bookId];

  const reviewPool: MockReview[] = [
    { id: '1', reviewer: 'Ana García',    rating: 5, comment: 'Una obra maestra. La narrativa atrapa desde la primera página.',        date: '2024-11-15' },
    { id: '2', reviewer: 'Carlos López',  rating: 4, comment: 'Muy recomendable. Los personajes están muy bien desarrollados.',          date: '2024-10-02' },
    { id: '3', reviewer: 'María Torres',  rating: 3, comment: 'Interesante, aunque la segunda mitad pierde algo de ritmo.',             date: '2024-09-20' },
    { id: '4', reviewer: 'Juan Méndez',   rating: 5, comment: 'Lo releí dos veces. Cada lectura revela nuevos detalles.',               date: '2024-08-08' },
    { id: '5', reviewer: 'Sofía Ruiz',    rating: 4, comment: 'Excelente exploración de los temas centrales. Prosa impecable.',         date: '2024-07-14' },
  ];

  const hash = bookId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = (hash % 3) + 2;
  MOCK_REVIEWS_BY_BOOK[bookId] = reviewPool.slice(0, count);
  return MOCK_REVIEWS_BY_BOOK[bookId];
}

function renderStarRating(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const isFilledStar = index < rating;
    return (
      <Star
        key={index}
        className={isFilledStar ? 'book-reviews__star book-reviews__star--filled' : 'book-reviews__star'}
        aria-hidden="true"
        size={14}
      />
    );
  });
}

export function BookReviewsPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const reviews = generateMockReviewsForBook(bookId ?? '');

  return (
    <section className="book-reviews">
      <h2 className="book-reviews__title">Reseñas de lectores</h2>
      <ul className="book-reviews__list">
        {reviews.map(review => (
          <li key={review.id} className="book-reviews__item">
            <div className="book-reviews__header">
              <span className="book-reviews__reviewer">{review.reviewer}</span>
              <span className="book-reviews__rating" aria-label={`${review.rating} de 5 estrellas`}>
                {renderStarRating(review.rating)}
              </span>
              <time className="book-reviews__date" dateTime={review.date}>
                {new Date(review.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </div>
            <p className="book-reviews__comment">{review.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
