/* =========================================================
   recipe.js — Recipe of the Day | recipe.html
   ========================================================= */

'use strict';

// =========================================================
// UTILITIES (duplicated so recipe.js is self-contained)
// =========================================================

function showToast(message, icon = 'fa-circle-check') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 2900);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function recipeImageSeed(name, w = 800, h = 500) {
  const seed = encodeURIComponent(name.replace(/\s+/g, ''));
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
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
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
  }
}

// =========================================================
// FETCH RECIPE DATA
// =========================================================

async function loadRecipes() {
  try {
    const res = await fetch('recipes.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load recipes:', err);
    showToast('Failed to load recipe. Please try again.', 'fa-triangle-exclamation');
    return [];
  }
}

function getRecipeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id ? parseInt(id, 10) : null;
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

function isFavorite(id) {
  return getFavorites().includes(id);
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
  updateFavoriteButton(id, added);
}

function updateFavoriteButton(id, fav) {
  const btn = document.getElementById('favoriteBtn');
  if (!btn) return;

  if (fav) {
    btn.innerHTML = `<i class="fa-solid fa-heart" aria-hidden="true"></i> Saved to Favorites`;
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');
    btn.setAttribute('aria-pressed', 'true');
  } else {
    btn.innerHTML = `<i class="fa-regular fa-heart" aria-hidden="true"></i> Add to Favorites`;
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    btn.setAttribute('aria-pressed', 'false');
  }
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
  let recents = getRecentRecipes().filter(r => r !== id);
  recents.unshift(id);
  recents = recents.slice(0, 5);
  localStorage.setItem('recentRecipes', JSON.stringify(recents));
}

// =========================================================
// DARK MODE
// =========================================================

function setupDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const html   = document.documentElement;

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
// SEARCH (on recipe page → navigates to index with term)
// =========================================================

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      window.location.href = `index.html`;
    }
  });
}

// =========================================================
// RENDER RECIPE DETAIL
// =========================================================

function renderRecipeDetail(recipe) {
  // Hero image
  const heroImg = document.getElementById('recipeHeroImg');
  if (heroImg) {
    heroImg.src = recipeImageSeed(recipe.name, 1600, 900);
    heroImg.alt = recipe.name;
  }

  // Title
  const title = document.getElementById('recipeTitle');
  if (title) title.textContent = recipe.name;

  // Breadcrumb
  const breadCat  = document.getElementById('breadcrumbCategory');
  const breadName = document.getElementById('breadcrumbName');
  if (breadCat)  breadCat.textContent  = recipe.category;
  if (breadName) breadName.textContent = recipe.name;

  // Document title
  document.title = `${recipe.name} — Recipe of the Day`;

  // Meta pills
  const metaGrid = document.getElementById('recipeMetaGrid');
  if (metaGrid) {
    const metas = [
      { icon: 'fa-hourglass-start',     label: 'Prep',     value: recipe.prepTime },
      { icon: 'fa-fire',                 label: 'Cook',     value: recipe.cookTime },
      { icon: 'fa-clock',               label: 'Total',    value: recipe.totalTime },
      { icon: 'fa-users',               label: 'Servings', value: recipe.servings },
      { icon: 'fa-fire-flame-curved',   label: 'Calories', value: `${recipe.calories} kcal` },
      { icon: 'fa-globe',               label: 'Cuisine',  value: recipe.cuisine },
      { icon: 'fa-tag',                 label: 'Category', value: recipe.category },
      { icon: 'fa-signal',              label: 'Difficulty', value: recipe.difficulty },
    ];

    metaGrid.innerHTML = metas.map(m => `
      <div class="recipe-meta-pill" role="listitem">
        <i class="fa-solid ${m.icon}" aria-hidden="true"></i>
        <span>${m.label}:</span>
        <strong>${escapeHtml(m.value.toString())}</strong>
      </div>
    `).join('');
  }

  // Dietary tags
  const dietaryEl = document.getElementById('recipeDietaryTags');
  if (dietaryEl) {
    const tags = [];
    if (recipe.vegan)        tags.push(`<span class="dietary-badge badge-vegan">Vegan</span>`);
    else if (recipe.vegetarian) tags.push(`<span class="dietary-badge badge-vegetarian">Vegetarian</span>`);
    if (recipe.glutenFree)   tags.push(`<span class="dietary-badge badge-glutenfree">Gluten Free</span>`);
    dietaryEl.innerHTML = tags.join('');
  }

  // Description
  const descEl = document.getElementById('recipeDescription');
  if (descEl) descEl.textContent = recipe.description;

  // Ingredients
  renderIngredients(recipe.ingredients);

  // Instructions
  renderInstructions(recipe.instructions);

  // Nutrition
  renderNutrition(recipe.nutrition, recipe.calories);

  // Tips
  renderTips(recipe.tips);

  // Favorite button state
  updateFavoriteButton(recipe.id, isFavorite(recipe.id));
}

// =========================================================
// INGREDIENTS
// =========================================================

function renderIngredients(ingredients) {
  const list = document.getElementById('ingredientsList');
  if (!list) return;

  list.innerHTML = ingredients.map((ing, idx) => `
    <li class="ingredient-item" data-index="${idx}" role="listitem" tabindex="0" aria-label="${escapeHtml(ing)}">
      <div class="ingredient-checkbox" aria-hidden="true"></div>
      <span class="ingredient-text">${escapeHtml(ing)}</span>
    </li>
  `).join('');

  // Toggle checked on click or enter
  list.querySelectorAll('.ingredient-item').forEach(item => {
    const toggle = () => item.classList.toggle('checked');
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  // Reset checklist button
  const resetBtn = document.getElementById('resetChecklistBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      list.querySelectorAll('.ingredient-item').forEach(item => item.classList.remove('checked'));
      showToast('Checklist reset', 'fa-rotate-left');
    });
  }
}

// =========================================================
// INSTRUCTIONS
// =========================================================

function renderInstructions(instructions) {
  const list = document.getElementById('instructionsList');
  if (!list) return;

  list.innerHTML = instructions.map((step, idx) => `
    <li class="instruction-step" role="listitem">
      <div class="step-number" aria-label="Step ${idx + 1}">${idx + 1}</div>
      <p class="step-text">${escapeHtml(step)}</p>
    </li>
  `).join('');
}

// =========================================================
// NUTRITION
// =========================================================

function renderNutrition(nutrition, calories) {
  const grid = document.getElementById('nutritionGrid');
  if (!grid) return;

  const items = [
    { icon: '💪', label: 'Protein',  value: nutrition.protein },
    { icon: '🌾', label: 'Carbs',    value: nutrition.carbs   },
    { icon: '🥑', label: 'Fat',      value: nutrition.fat     },
    { icon: '🌿', label: 'Fiber',    value: nutrition.fiber   },
    { icon: '🍬', label: 'Sugar',    value: nutrition.sugar   },
    { icon: '🧂', label: 'Sodium',   value: nutrition.sodium  },
  ];

  grid.innerHTML = items.map(item => `
    <div class="nutrition-card" role="listitem">
      <div class="nutrition-icon" aria-hidden="true">${item.icon}</div>
      <div class="nutrition-value">${escapeHtml(item.value)}</div>
      <div class="nutrition-label">${item.label}</div>
    </div>
  `).join('');
}

// =========================================================
// TIPS
// =========================================================

function renderTips(tips) {
  const grid = document.getElementById('tipsGrid');
  if (!grid) return;

  grid.innerHTML = tips.map(tip => `
    <div class="tip-card" role="listitem">
      <div class="tip-icon" aria-hidden="true">💡</div>
      <p class="tip-text">${escapeHtml(tip)}</p>
    </div>
  `).join('');
}

// =========================================================
// RELATED RECIPES
// =========================================================

function renderRelatedRecipes(currentRecipe, allRecipes) {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;

  // Find recipes in same category or cuisine, excluding current
  let related = allRecipes.filter(r =>
    r.id !== currentRecipe.id &&
    (r.category === currentRecipe.category || r.cuisine === currentRecipe.cuisine)
  );

  // Shuffle and take up to 4
  related = related.sort(() => Math.random() - 0.5).slice(0, 4);

  if (related.length === 0) {
    grid.closest('.related-section').style.display = 'none';
    return;
  }

  grid.innerHTML = related.map(recipe => createRecipeCard(recipe)).join('');

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
      const id = parseInt(btn.dataset.id, 10);
      toggleFavorite(id);
    });
  });
}

// =========================================================
// CREATE RECIPE CARD (self-contained for recipe.html)
// =========================================================

function createRecipeCard(recipe) {
  const favorites   = getFavorites();
  const isFav       = favorites.includes(recipe.id);
  const imgSrc      = recipeImageSeed(recipe.name, 400, 300);
  const diffClass   = `difficulty-${recipe.difficulty.toLowerCase()}`;

  const dietaryBadges = [];
  if (recipe.vegan)            dietaryBadges.push(`<span class="dietary-badge badge-vegan">Vegan</span>`);
  else if (recipe.vegetarian)  dietaryBadges.push(`<span class="dietary-badge badge-vegetarian">Vegetarian</span>`);
  if (recipe.glutenFree)       dietaryBadges.push(`<span class="dietary-badge badge-glutenfree">GF</span>`);

  return `
    <article
      class="recipe-card"
      data-id="${recipe.id}"
      role="listitem"
      tabindex="0"
      aria-label="${escapeHtml(recipe.name)}"
    >
      <div class="card-image-wrap">
        <img
          class="card-image"
          src="${imgSrc}"
          alt="${escapeHtml(recipe.name)}"
          loading="lazy"
          width="400" height="300"
        />
        <div class="card-image-overlay" aria-hidden="true"></div>
        <span class="card-category-badge">${escapeHtml(recipe.category)}</span>
        <span class="card-difficulty-badge ${diffClass}">${escapeHtml(recipe.difficulty)}</span>
        <button
          class="card-favorite-btn ${isFav ? 'is-favorite' : ''}"
          data-id="${recipe.id}"
          aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
          aria-pressed="${isFav}"
        >
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart" aria-hidden="true"></i>
        </button>
      </div>
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
// NAVIGATE (with fade transition)
// =========================================================

function navigateToRecipe(id) {
  addToRecent(id);
  document.body.style.opacity    = '0';
  document.body.style.transition = 'opacity 0.25s ease';
  setTimeout(() => {
    window.location.href = `recipe.html?id=${id}`;
  }, 250);
}

// =========================================================
// ACTION BUTTONS
// =========================================================

function setupPrintButton() {
  const btn = document.getElementById('printBtn');
  if (btn) btn.addEventListener('click', () => window.print());
}

function setupShareButton(recipe) {
  const btn = document.getElementById('shareBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const url   = window.location.href;
    const title = recipe.name;
    const text  = recipe.description;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast('Recipe shared!', 'fa-share-nodes');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(url, 'Recipe link copied!');
        }
      }
    } else {
      copyToClipboard(url, 'Recipe link copied to clipboard!');
    }
  });
}

function setupCopyIngredientsButton(recipe) {
  const btn = document.getElementById('copyIngredientsBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const text = `${recipe.name} — Ingredients:\n\n` +
      recipe.ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n');

    copyToClipboard(text, 'Ingredients copied to clipboard!');
  });
}

async function copyToClipboard(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast(successMessage, 'fa-clipboard-check');
  } catch (err) {
    showToast('Could not copy to clipboard.', 'fa-triangle-exclamation');
  }
}

function setupFavoriteButton(recipe) {
  const btn = document.getElementById('favoriteBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    toggleFavorite(recipe.id);
  });
}

// =========================================================
// BACK BUTTON
// =========================================================

function setupBackButton() {
  const btn = document.getElementById('backBtn');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.referrer && document.referrer.includes('index.html')) {
      history.back();
    } else {
      window.location.href = 'index.html';
    }
  });
}

// =========================================================
// ERROR STATE
// =========================================================

function renderError(message) {
  const detail = document.getElementById('recipeDetail');
  if (!detail) return;

  detail.innerHTML = `
    <div class="container">
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <h3>Recipe Not Found</h3>
        <p>${escapeHtml(message)}</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:24px;">
          <i class="fa-solid fa-house" aria-hidden="true"></i>
          Back to All Recipes
        </a>
      </div>
    </div>
  `;
}

// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Apply dark mode immediately to prevent flash
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  showLoading();

  const recipeId = getRecipeFromUrl();
  if (!recipeId) {
    hideLoading();
    renderError('No recipe ID provided in the URL.');
    return;
  }

  const allRecipes = await loadRecipes();
  hideLoading();

  if (!allRecipes.length) {
    renderError('Could not load recipe data.');
    return;
  }

  const recipe = allRecipes.find(r => r.id === recipeId);

  if (!recipe) {
    renderError(`Recipe with ID ${recipeId} was not found.`);
    return;
  }

  // Mark as recently viewed
  addToRecent(recipe.id);

  // Setup all UI
  setupDarkMode();
  setupScrollToTop();
  setupMobileMenu();
  setupSearch();
  setupBackButton();
  setupPrintButton();
  setupShareButton(recipe);
  setupCopyIngredientsButton(recipe);
  setupFavoriteButton(recipe);

  // Render all sections
  renderRecipeDetail(recipe);
  renderRelatedRecipes(recipe, allRecipes);
});
