import type { LibraryBook, WishlistBook } from './types';
import { BOOK_DEFAULTS } from './utils/enums';
import { APP_API_URL } from './config';

const search_endpoint = 'https://openlibrary.org/search.json';
const cover_endpoint = 'https://covers.openlibrary.org/b/id';
const fields_book = 'key,title,author_name,cover_i,subject,first_publish_year,edition_count';

function transformOpenLibraryDocumentToLibraryBook(rawDocument: Record<string, unknown>): LibraryBook {
  return {
    bookId: String(rawDocument.key ?? `generated-${Math.random().toString(36).slice(2)}`),
    bookTitle: String(rawDocument.title ?? BOOK_DEFAULTS.title),
    authorNames: Array.isArray(rawDocument.author_name)
      ? (rawDocument.author_name as string[]).slice(0, 3)
      : BOOK_DEFAULTS.authors,
    coverImageId: typeof rawDocument.cover_i === 'number' ? rawDocument.cover_i : BOOK_DEFAULTS.coverImageId,
    subjectCategories: Array.isArray(rawDocument.subject)
      ? (rawDocument.subject as string[]).slice(0, 6)
      : BOOK_DEFAULTS.subjects,
    firstPublishedYear: typeof rawDocument.first_publish_year === 'number' ? rawDocument.first_publish_year : BOOK_DEFAULTS.year,
    editionCount: typeof rawDocument.edition_count === 'number' ? rawDocument.edition_count : BOOK_DEFAULTS.editions,
    availabilityStatus: BOOK_DEFAULTS.availabilityStatus,
  };
}

export function buildBookCoverImageUrl(coverImageId: number, imageSize: 'S' | 'M' | 'L' = 'M'): string {
  return `${cover_endpoint}/${coverImageId}-${imageSize}.jpg`;
}

function buildOpenLibrarySearchRequestUrl(searchQuery: string, pageNumber: number): string {
  return `${search_endpoint}?q=${encodeURIComponent(searchQuery)}&limit=24&page=${pageNumber}&fields=${fields_book}`;
}

export async function fetchBooksBySearchQuery(
  searchQuery: string,
  pageNumber = 1
): Promise<LibraryBook[]> {
  const requestUrl = buildOpenLibrarySearchRequestUrl(searchQuery, pageNumber);
  const apiResponse = await fetch(requestUrl);

  if (!apiResponse.ok) {
    throw new Error(`Open Library API request failed with status ${apiResponse.status}`);
  }

  const responsePayload = await apiResponse.json();
  console.log('API response:', responsePayload);
  const rawDocuments: Record<string, unknown>[] = responsePayload.docs ?? [];
  return rawDocuments.map(transformOpenLibraryDocumentToLibraryBook);
}

export async function fetchDefaultLibraryCatalog(): Promise<LibraryBook[]> {
  return fetchBooksBySearchQuery('classic world literature fiction science');
}

async function extractApiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === 'string') {
      return payload.error;
    }
  } catch {
    // no-op
  }
  return `Request failed with status ${response.status}`;
}

export async function fetchUserWishlist(token: string): Promise<WishlistBook[]> {
  const response = await fetch(`${APP_API_URL}/wishlist`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Auth-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response));
  }

  const payload = await response.json();
  return Array.isArray(payload.items) ? payload.items : [];
}

export async function addBookToWishlist(
  token: string,
  book: Pick<WishlistBook, 'bookId' | 'bookTitle' | 'authorName' | 'coverImageId'>
): Promise<WishlistBook[]> {
  const response = await fetch(`${APP_API_URL}/wishlist`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Auth-Token': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response));
  }

  const payload = await response.json();
  return Array.isArray(payload.items) ? payload.items : [];
}

export async function removeBookFromWishlist(token: string, bookId: string): Promise<WishlistBook[]> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'X-Auth-Token': token,
  };
  const encodedBookId = encodeURIComponent(bookId);
  let response = await fetch(`${APP_API_URL}/wishlist?bookId=${encodedBookId}`, {
    method: 'DELETE',
    headers,
  });

  if (response.status === 404) {
    response = await fetch(`${APP_API_URL}/wishlist/${encodedBookId}`, {
      method: 'DELETE',
      headers,
    });
  }

  if (response.status === 404) {
    response = await fetch(`${APP_API_URL}/wishlistDelete/${encodedBookId}`, {
      method: 'DELETE',
      headers,
    });
  }

  if (!response.ok) {
    throw new Error(await extractApiErrorMessage(response));
  }

  const payload = await response.json();
  return Array.isArray(payload.items) ? payload.items : [];
}
