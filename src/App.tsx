import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';

const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const BookDetailPage = lazy(() => import('./pages/BookDetailPage').then(m => ({ default: m.BookDetailPage })));
const BookReviewsPage = lazy(() => import('./pages/BookReviewsPage').then(m => ({ default: m.BookReviewsPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const LoansPage = lazy(() => import('./pages/LoansPage').then(m => ({ default: m.LoansPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

function PageLoadingFallback() {
  return (
    <main className="app-layout__main-content">
      <p className="app-layout__loading">Cargando...</p>
    </main>
  );
}

function ProtectedRoute() {
  const { token, isCheckingAuth } = useAuth();
  if (isCheckingAuth) {
    return <PageLoadingFallback />;
  }
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RootLayout() {
  return (
    <ThemeProvider>
      <div className="app-layout">
        <Header />
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
        <footer className="app-layout__footer">
          <p>JU Library &copy; {new Date().getFullYear()} — Datos provistos por Open Library</p>
        </footer>
      </div>
    </ThemeProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <ThemeProvider>
        <Suspense fallback={<PageLoadingFallback />}>
          <LoginPage />
        </Suspense>
      </ThemeProvider>
    ),
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'about',
            element: <AboutPage />,
          },
          {
            path: 'loans',
            element: <LoansPage />,
          },
          {
            path: 'wishlist',
            element: <WishlistPage />,
          },
          {
            path: 'book/:bookId',
            element: <BookDetailPage />,
            children: [
              {
                path: 'reviews',
                element: <BookReviewsPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
