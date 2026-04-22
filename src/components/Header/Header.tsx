import { NavLink, useNavigate } from 'react-router-dom';
import { BookOpenText, Moon, Sun } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import type { AppDispatch } from '../../store/store';
import { clearWishlist } from '../../store/wishlistSlice';
import './Header.css';

const navLinks = [
  { to: '/', label: 'Inicio', fin: true },
  { to: '/loans', label: 'Préstamos', fin: false },
  { to: '/wishlist', label: 'Lista de deseos', fin: false },
  { to: '/about', label: 'Acerca de', fin: false },
];

function getToggleThemeLabel(tema: 'light' | 'dark'): string {
  return tema === 'light'
    ? 'Modo oscuro'
    : 'Modo claro';
}

function buildNavItem(itemData: { to: string; label: string; fin: boolean }, idx: number) {
  return (
    <li key={idx} className="site-nav__item">
      <NavLink
        to={itemData.to}
        end={itemData.fin}
        className={({ isActive }) =>
          isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
        }
      >
        {itemData.label}
      </NavLink>
    </li>
  );
}

export function Header() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentThemeMode, toggleThemeMode } = useThemeContext();
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const toggleThemeLabel = getToggleThemeLabel(currentThemeMode);

  function handleLogout() {
    dispatch(clearWishlist());
    logout();
    navigate('/login');
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <BookOpenText className="site-header__brand-icon" aria-hidden="true" size={22} />
          <h1 className="site-header__brand-name">JULibrary</h1>
        </div>

        <nav className="site-nav" aria-label="Navegación principal">
          <ul className="site-nav__list">
            {navLinks.map(buildNavItem)}
          </ul>
        </nav>

        <div className="site-header__actions">
          <button
            className="theme-toggle-button"
            onClick={toggleThemeMode}
            aria-label={`Cambiar a ${toggleThemeLabel}`}
          >
            {currentThemeMode === 'light' ? (
              <Moon className="theme-toggle-button__icon" aria-hidden="true" size={16} />
            ) : (
              <Sun className="theme-toggle-button__icon" aria-hidden="true" size={16} />
            )}
            <span className="theme-toggle-button__label">{toggleThemeLabel}</span>
          </button>
          {token && (
            <button
              className="logout-button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
