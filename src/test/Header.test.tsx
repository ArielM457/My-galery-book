import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { Header } from '../components/Header';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Provider store={store}>
        <AuthProvider>
          <ThemeProvider>
            <Header />
          </ThemeProvider>
        </AuthProvider>
      </Provider>
    </MemoryRouter>
  );

describe('Header', () => {
  it('añadimos inf', () => {
    renderHeader();
    expect(screen.getByText('JULibrary')).toBeInTheDocument();
  });

  it('nav links visibles', () => {
    renderHeader();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Acerca de')).toBeInTheDocument();
  });

  it('vemos si es funcional - theme toggle', () => {
    renderHeader();
    const btn = screen.getByRole('button', { name: /cambiar a/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it('no muestra logout sin sesion', () => {
    renderHeader();
    expect(screen.queryByText('Salir')).not.toBeInTheDocument();
  });
});
