import { SearchBar } from '../../components/SearchBar';
import { FilterPanel } from '../../components/FilterPanel';
import { BookList } from '../../components/BookList';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="app-layout__main-content home-page">
      <div className="home-page__controls-section">
        <SearchBar />
        <FilterPanel />
      </div>
      <BookList />
    </main>
  );
}
