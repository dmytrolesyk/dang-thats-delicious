import axios from 'axios';

const searchResultsHTML = stores => stores.map(
  store => `
    <a href="/stores/${store.slug}" class="search__result">
      <strong>${store.name}</strong>
    </a>
  `,
).join('');

export default (search) => {
  if (!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');
  
  searchInput.on('input', async function() {
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }
    searchResults.style.display = 'block';
    searchResults.innerHTML = `
      <div class="search__result">
        No results for ${this.value} found
      </div>
    `;
    
    const res = await axios.get(`/api/search?q=${this.value}`);
    if (res.data.length) {
      searchResults.innerHTML = searchResultsHTML(res.data);
    }
  });

  searchInput.on('keyup', (e) => {
    if (![38, 40, 13].includes(e.keyCode)) return;
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      current.click();
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
};
