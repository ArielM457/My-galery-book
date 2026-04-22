import type { AvailabilityStatus } from './utils/enums';

export interface LibraryBook {
  bookId: string;
  bookTitle: string;
  authorNames: string[];
  coverImageId: number | null;
  subjectCategories: string[];
  firstPublishedYear: number | null;
  editionCount: number;
  availabilityStatus: AvailabilityStatus;
}

export interface UserLoanRecord {
  loanId: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt: string | null;
  completedAt: string | null;
  rating: number | null;
}

export interface BookReservation {
  reservationId: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  reservedAt: string;
}

export interface WishlistBook {
  bookId: string;
  bookTitle: string;
  authorName: string;
  coverImageId: number | null;
  addedAt: string;
}
