import { setSearchQuery } from './render.js';
import { debounce } from './utils.js';

const searchInput = document.getElementById('search-input');

export function initSearch() {
  const handleInput = debounce(() => setSearchQuery(searchInput.value), 120);
  searchInput.addEventListener('input', handleInput);
}
