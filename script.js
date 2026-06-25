/* =========================================================
   script.js — Recipe of the Day | index.html
   ========================================================= */

'use strict';

// =========================================================
// STATE
// =========================================================
let allRecipes = [];
let activeFilters = [];   // array of filter strings
let currentSearchTerm = '';

// =========================================================
// UTILITIES
// =========================================================

/** Show a toast notification */
function showToast(message, icon = 'fa-circle-check') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${message}`;
  container.appendChild(toast);

  // Remove after animation completes (2.8 s)
  setTimeout(() => {
    toast.remove();
  }, 2900);
}

/** Encode recipe name for picsum seed (no spaces) */
function recipeImageSeed(name, w = 400, h = 300) {
  const seed = encodeURIComponent(name.replace(/\s+/g, ''));
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/** Get ordinal day-of-year (1-365) */
function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

// =========================================================
// LOADING
// =========================================================

function showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 400);
  }
}

// =========================================================
// LOAD RECIPES
// =========================================================

async function loadRecipes() {
  try {
    const response = await fetch('recipes.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load recipes:', error);
    showToast('Failed to load recipes. Please refresh.', 'fa-triangle-exclamation');
    return [];
  }
}

// =========================================================
// RECIPE OF THE DAY
// =========================================================

function getRecipeOfDay(recipes) {
  if (!recipes || recipes.length === 0) return null;
  const dayOfYear = getDayOfYear();
  return recipes[dayOfYear % recipes.length];
}

// =========================================================
// RENDER HERO
// =========================================================

function renderHero(recipe) {
  if (!recipe) return;

  const heroBg        = document.getElementById('heroBg');
  const heroTitle     = document.getElementById('heroTitle');
  const heroDesc      = document.getElementById('heroDescription');
  const heroMeta      = document.getElementById('heroMeta');
  const heroViewBtn   = document.getElementById('heroViewBtn');

  if (heroBg) {
    heroBg.src = recipeImageSeed(recipe.name, 1600, 900);
    heroBg.alt = recipe.name;
  }

  if (heroTitle)  heroTitle.textContent  = recipe.name;
  if (heroDesc)   heroDesc.textContent   = recipe.description;

  // Meta pills
  if (heroMeta) {
    const metaItems = [
      { icon: 'fa-clock',          label: recipe.totalTime },
      { icon: 'fa-fire-flame-curved', label: `${recipe.calories} kcal` },
      { icon: 'fa-signal',         label: recipe.difficulty },
      { icon: 'fa-globe',          label: recipe.cuisine },
      { icon: 'fa-users',          label: `${recipe.servings} servings` },
      { icon: 'fa-tag',            label: recipe.category },
    ];

    heroMeta.innerHTML = metaItems.map(item => `
      <div class="hero-meta-item" role="listitem">
        <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
        ${escapeHtml(item.label.toString())}
      </div>
    `).join('');
  }

  // View Recipe button
  if (heroViewBtn) {
    heroViewBtn.onclick = () => navigateToRecipe(recipe.id);
  }

  // Update document title
  document.title = `${recipe.name} — Recipe of the Day`;
}

// =========================================================
// FILTER LOGIC
// =========================================================

/**
 * Filter recipes:
 *  - Within each type group (category, dietary, cuisine, difficulty)
 *    active filters use OR logic.
 *  - Across type groups, logic is AND.
 *  - Search term is always AND with filters.
 */
function filterRecipes(recipes, filters, searchTerm) {
  // Group filters by type
  const groups = {};
  filters.forEach(f => {
    // Determine type from the chip's data-type attribute
    const chip = document.querySelector(`[data-filter="${f}"]`);
    const type = chip ? chip.dataset.type : 'unknown';
    if (!groups[type]) groups[type] = [];
    groups[type].push(f);
  });

  return recipes.filter(recipe => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const haystack = [recipe.name, recipe.description, recipe.cuisine, recipe.category, recipe.difficulty]
        .join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    // Filter groups (AND across groups, OR within group)
    for (const type in groups) {
      const groupFilters = groups[type];
      let matchesGroup = false;

      for (const f of groupFilters) {
        if (type === 'category'   && recipe.category   === f) { matchesGroup = true; break; }
        if (type === 'cuisine'    && recipe.cuisine     === f) { matchesGroup = true; break; }
        if (type === 'difficulty' && recipe.difficulty  === f) { matchesGroup = true; break; }
        if (type === 'dietary') {
          if (f === 'vegetarian' && recipe.vegetarian)  { matchesGroup = true; break; }
          if (f === 'vegan'      && recipe.vegan)        { matchesGroup = true; break; }
          if (f === 'glutenFree' && recipe.glutenFree)  { matchesGroup = true; break; }
        }
      }

      if (!matchesGroup) return false;
    }

    return true;
  });
}

// =========================================================
// RENDER RECIPE GRID
// =========================================================

function renderRecipeGrid(recipes) {
  const grid  = document.getElementById('recipeGrid');
  const count = document.getElementById('recipesCount');
  if (!grid) return;

  if (count) {
    count.textContent = `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`;
  }

  if (recipes.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <h3>No recipes found</h3>
        <p>Try adjusting your search or clearing some filters.</p>
        <button class="btn btn-outline" onclick="clearAllFilters()" style="margin-top:16px;">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i> Clear Filters
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = recipes.map(recipe => createRecipeCard(recipe)).join('');

  // Attach event listeners
  grid.querySelectorAll('.recipe-card').forEach(card => {
    const id = parseInt(card.dataset.id, 10);

    // Click card → navigate
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-favorite-btn')) return;
      navigateToRecipe(id);
    });

    // Keyboard navigation
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.card-favorite-btn')) {
        e.preventDefault();
        navigateToRecipe(id);
      }
    });
  });

  // Favorite buttons
  grid.querySelectorAll('.card-favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      toggleFavorite(id);
    });
  });
}

// =========================================================
// CREATE RECIPE CARD HTML
// =========================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function createRecipeCard(recipe) {
  const favorites = getFavorites();
  const isFav = favorites.includes(recipe.id);
  const imgSrc = recipeImageSeed(recipe.name, 400, 300);
  const diffClass = `difficulty-${recipe.difficulty.toLowerCase()}`;

  const dietaryBadges = [];
  if (recipe.vegan)       dietaryBadges.push(`<span class="dietary-badge badge-vegan">Vegan</span>`);
  else if (recipe.vegetarian) dietaryBadges.push(`<span class="dietary-badge badge-vegetarian">Vegetarian</span>`);
  if (recipe.glutenFree)  dietaryBadges.push(`<span class="dietary-badge badge-glutenfree">GF</span>`);

  return `
    <article
      class="recipe-card"
      data-id="${recipe.id}"
      role="listitem"
      tabindex="0"
      aria-label="${escapeHtml(recipe.name)}"
    >
      <!-- Image -->
      <div class="card-image-wrap">
        <img
          class="card-image"
          src="${imgSrc}"
          alt="${escapeHtml(recipe.name)}"
          loading="lazy"
          width="400" height="300"
        />
        <div class="card-image-overlay" aria-hidden="true"></div>

        <!-- Badges -->
        <span class="card-category-badge">${escapeHtml(recipe.category)}</span>
        <span class="card-difficulty-badge ${diffClass}">${escapeHtml(recipe.difficulty)}</span>

        <!-- Favorite Button -->
        <button
          class="card-favorite-btn ${isFav ? 'is-favorite' : ''}"
          data-id="${recipe.id}"
          aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
          aria-pressed="${isFav}"
          title="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
        >
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(recipe.name)}</h3>
        <p class="card-description">${escapeHtml(recipe.description)}</p>

        <div class="card-meta">
          <span class="card-meta-item">
            <i class="fa-solid fa-clock" aria-hidden="true"></i>
            ${escapeHtml(recipe.totalTime)}
          </span>
          <span class="card-meta-item">
            <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
            ${recipe.calories} kcal
          </span>
          <span class="card-meta-item">
            <i class="fa-solid fa-globe" aria-hidden="true"></i>
            ${escapeHtml(recipe.cuisine)}
          </span>
          <span class="card-meta-item">
            <i class="fa-solid fa-users" aria-hidden="true"></i>
            ${recipe.servings} servings
          </span>
        </div>

        ${dietaryBadges.length ? `<div class="card-dietary">${dietaryBadges.join('')}</div>` : ''}
      </div>
    </article>
  `;
}

// =========================================================
// SEARCH
// =========================================================

function setupSearch() {
  const input    = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');
  if (!input) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentSearchTerm = input.value.trim();
      applyFiltersAndSearch();
      updateSearchDropdown(currentSearchTerm, dropdown);
    }, 200);
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (dropdown && !input.closest('.header-search').contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Clear search on Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      currentSearchTerm = '';
      applyFiltersAndSearch();
      if (dropdown) dropdown.classList.remove('open');
    }
  });
}

function updateSearchDropdown(term, dropdown) {
  if (!dropdown) return;

  if (!term || term.length < 2) {
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    return;
  }

  const matches = allRecipes.filter(r => {
    return r.name.toLowerCase().includes(term.toLowerCase()) ||
           r.cuisine.toLowerCase().includes(term.toLowerCase()) ||
           r.category.toLowerCase().includes(term.toLowerCase());
  }).slice(0, 5);

  if (matches.length === 0) {
    dropdown.classList.remove('open');
    return;
  }

  dropdown.innerHTML = matches.map(r => `
    <div class="dropdown-item" data-id="${r.id}" role="option" tabindex="0" aria-label="${escapeHtml(r.name)}">
      <img src="${recipeImageSeed(r.name, 44, 44)}" alt="" loading="lazy" />
      <div class="dropdown-item-info">
        <div class="name">${escapeHtml(r.name)}</div>
        <div class="meta">${escapeHtml(r.cuisine)} &bull; ${escapeHtml(r.category)}</div>
      </div>
    </div>
  `).join('');

  dropdown.classList.add('open');

  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateToRecipe(parseInt(item.dataset.id, 10));
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') navigateToRecipe(parseInt(item.dataset.id, 10));
    });
  });
}

// =========================================================
// FILTER CHIPS
// =========================================================

function setupFilters() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      const isActive = chip.classList.contains('active');

      if (isActive) {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
        activeFilters = activeFilters.filter(f => f !== filter);
      } else {
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        activeFilters.push(filter);
      }

      updateFilterUI();
      applyFiltersAndSearch();
    });
  });
}

function updateFilterUI() {
  const badge   = document.getElementById('activeCountBadge');
  const clearBtn = document.getElementById('clearFiltersBtn');

  if (badge) {
    badge.textContent = activeFilters.length;
    badge.classList.toggle('visible', activeFilters.length > 0);
  }

  if (clearBtn) {
    clearBtn.classList.toggle('visible', activeFilters.length > 0);
  }
}

function clearAllFilters() {
  activeFilters = [];
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active');
    chip.setAttribute('aria-pressed', 'false');
  });
  updateFilterUI();
  applyFiltersAndSearch();
}

// Wire clear button
document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
});

function applyFiltersAndSearch() {
  const filtered = filterRecipes(allRecipes, activeFilters, currentSearchTerm);
  renderRecipeGrid(filtered);
}

// =========================================================
// FAVORITES
// =========================================================

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const index = favorites.indexOf(id);
  let added;

  if (index === -1) {
    favorites.push(id);
    added = true;
    showToast('Added to favorites!', 'fa-heart');
  } else {
    favorites.splice(index, 1);
    added = false;
    showToast('Removed from favorites', 'fa-heart-crack');
  }

  saveFavorites(favorites);

  // Update all buttons for this id in the grid
  document.querySelectorAll(`.card-favorite-btn[data-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('is-favorite', added);
    btn.setAttribute('aria-pressed', added);
    btn.setAttribute('aria-label', added ? 'Remove from favorites' : 'Add to favorites');
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = `fa-${added ? 'solid' : 'regular'} fa-heart`;
    }
  });

  // Re-render favorites section
  renderFavorites(allRecipes);
}

function renderFavorites(recipes) {
  const section  = document.getElementById('favorites-section');
  const grid     = document.getElementById('favoritesGrid');
  const countEl  = document.getElementById('favoritesCount');
  if (!section || !grid) return;

  const favorites   = getFavorites();
  const favRecipes  = recipes.filter(r => favorites.includes(r.id));

  if (favRecipes.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  if (countEl) countEl.textContent = `${favRecipes.length} saved recipe${favRecipes.length !== 1 ? 's' : ''}`;

  grid.innerHTML = favRecipes.map(recipe => createRecipeCard(recipe)).join('');

  // Attach events
  grid.querySelectorAll('.recipe-card').forEach(card => {
    const id = parseInt(card.dataset.id, 10);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-favorite-btn')) return;
      navigateToRecipe(id);
    });
  });

  grid.querySelectorAll('.card-favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(parseInt(btn.dataset.id, 10));
    });
  });
}

// =========================================================
// RECENT RECIPES
// =========================================================

function getRecentRecipes() {
  try {
    return JSON.parse(localStorage.getItem('recentRecipes') || '[]');
  } catch {
    return [];
  }
}

function addToRecent(id) {
  let recents = getRecentRecipes();
  // Remove if already exists (dedup)
  recents = recents.filter(r => r !== id);
  // Add to front
  recents.unshift(id);
  // Keep max 5
  recents = recents.slice(0, 5);
  localStorage.setItem('recentRecipes', JSON.stringify(recents));
}

function renderRecentRecipes(recipes) {
  const section  = document.getElementById('recent-section');
  const grid     = document.getElementById('recentsGrid');
  const countEl  = document.getElementById('recentsCount');
  if (!section || !grid) return;

  const recents       = getRecentRecipes();
  const recentRecipes = recents
    .map(id => recipes.find(r => r.id === id))
    .filter(Boolean);

  if (recentRecipes.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  if (countEl) countEl.textContent = `${recentRecipes.length} recently viewed`;

  grid.innerHTML = recentRecipes.map(recipe => createRecipeCard(recipe)).join('');

  grid.querySelectorAll('.recipe-card').forEach(card => {
    const id = parseInt(card.dataset.id, 10);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-favorite-btn')) return;
      navigateToRecipe(id);
    });
  });

  grid.querySelectorAll('.card-favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(parseInt(btn.dataset.id, 10));
    });
  });
}

// =========================================================
// RANDOM RECIPE
// =========================================================

function getRandomRecipe() {
  if (allRecipes.length === 0) return;
  const idx = Math.floor(Math.random() * allRecipes.length);
  navigateToRecipe(allRecipes[idx].id);
}

// =========================================================
// NAVIGATE TO RECIPE (with page fade-out)
// =========================================================

function navigateToRecipe(id) {
  addToRecent(id);
  // Fade out body
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.25s ease';
  setTimeout(() => {
    window.location.href = `recipe.html?id=${id}`;
  }, 250);
}

// =========================================================
// DARK MODE
// =========================================================

function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const html   = document.documentElement;

  // Apply saved preference
  const saved = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', saved);

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// =========================================================
// MOBILE MENU
// =========================================================

function setupMobileMenu() {
  const btn    = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    const icon = btn.querySelector('i');
    if (icon) icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !drawer.contains(e.target)) {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars';
    }
  });
}

// =========================================================
// SCROLL TO TOP
// =========================================================

function setupScrollToTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// =========================================================
// RANDOM RECIPE BUTTON
// =========================================================

function setupRandomButton() {
  const btn = document.getElementById('randomRecipeBtn');
  if (!btn) return;
  btn.addEventListener('click', getRandomRecipe);
}

// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
  showLoading();

  // Apply dark mode immediately to prevent flash
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  allRecipes = await loadRecipes();

  hideLoading();

  setupDarkMode();
  setupSearch();
  setupFilters();
  setupScrollToTop();
  setupMobileMenu();
  setupRandomButton();

  const recipeOfDay = getRecipeOfDay(allRecipes);
  if (recipeOfDay) renderHero(recipeOfDay);

  renderRecipeGrid(allRecipes);
  renderFavorites(allRecipes);
  renderRecentRecipes(allRecipes);
});
