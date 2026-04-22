import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import booksReducer from '../store/booksSlice';
import { FilterPanel } from '../components/FilterPanel';

const makeStore = () =>
  configureStore({ reducer: { books: booksReducer } });

const renderPanel = () => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <FilterPanel />
    </Provider>
  );
  return store;
};

describe('FilterPanel', () => {
  it('añadimos inf - categorias', () => {
    renderPanel();
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Ficción')).toBeInTheDocument();
    expect(screen.getByText('Ciencia')).toBeInTheDocument();
  });

  it('vemos si es funcional - click categoria', () => {
    const store = renderPanel();
    fireEvent.click(screen.getByText('Ficción'));
    expect(store.getState().books.filterCategory).toBe('fiction');
  });

  it('select ordenamiento', () => {
    renderPanel();
    const select = screen.getByLabelText('Criterio de ordenamiento');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'title_asc' } });
  });
});
