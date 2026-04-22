import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { setFilterCategory, setSortCriterion } from '../../store/booksSlice';
import { SORT_OPTIONS, FILTER_CATEGORIES } from '../../utils/enums';
import type { SortCriterion, FilterCategory } from '../../utils/enums';
import './FilterPanel.css';

export function FilterPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { filterCategory, sortCriterion } = useSelector((state: RootState) => state.books);

  function handleSortCriterionSelection(event: React.ChangeEvent<HTMLSelectElement>) {
    dispatch(setSortCriterion(event.target.value as SortCriterion));
  }

  function handleCategoryFilterButtonClick(selectedCategory: FilterCategory) {
    dispatch(setFilterCategory(selectedCategory));
  }

  return (
    <div className="filter-panel">
      <div className="filter-panel__categories">
        {FILTER_CATEGORIES.map(categoryOption => (
          <button
            key={categoryOption.value}
            className={`filter-panel__category-button ${
              filterCategory === categoryOption.value
                ? 'filter-panel__category-button--active'
                : ''
            }`}
            onClick={() => handleCategoryFilterButtonClick(categoryOption.value)}
            aria-pressed={filterCategory === categoryOption.value}
          >
            {categoryOption.displayLabel}
          </button>
        ))}
      </div>
      <div className="filter-panel__sort-section">
        <label className="filter-panel__sort-label" htmlFor="sort-criterion-select">
          Ordenar por:
        </label>
        <select
          id="sort-criterion-select"
          className="filter-panel__sort-select"
          value={sortCriterion}
          onChange={handleSortCriterionSelection}
          aria-label="Criterio de ordenamiento"
        >
          {SORT_OPTIONS.map(sortOption => (
            <option key={sortOption.value} value={sortOption.value}>
              {sortOption.displayLabel}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
