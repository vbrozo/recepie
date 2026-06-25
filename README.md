# Recipe of the Day

A modern, responsive recipe website built with vanilla HTML, CSS, and JavaScript — no frameworks, no backend, no dependencies beyond a couple of CDN fonts and icons.

## Live Features

- **Recipe of the Day** — deterministically selected by day of year so every visitor sees the same recipe on the same day
- **Recipe Detail Pages** — full ingredients, step-by-step instructions, nutrition breakdown, tips, and related recipes
- **Instant Search** — filters the recipe grid as you type
- **Filter Chips** — filter by category, dietary preference, cuisine, or difficulty; combinable
- **Favorites** — add/remove recipes with a heart button; persisted in `localStorage`
- **Recent Recipes** — last 5 viewed recipes stored in `localStorage`
- **Random Recipe** — jump to a random recipe instantly
- **Dark Mode** — toggle between light and dark theme; preference persisted in `localStorage`
- **Copy Ingredients** — copy the full ingredient list to clipboard with one click
- **Print Recipe** — print-optimized stylesheet hides nav and action buttons
- **Share Recipe** — uses the Web Share API where available, falls back to copying the URL
- **Scroll-to-Top** — floating button appears on scroll
- **Smooth Transitions** — fade-in animations on page load and navigation
- **Loading Animation** — spinner overlay while recipes load

## Project Structure

```
/
├── index.html       # Home page — hero, filters, search, recipe grid, favorites, recents
├── recipe.html      # Recipe detail page
├── styles.css       # All styles — themes, layout, animations, print
├── script.js        # Home page logic
├── recipe.js        # Recipe detail page logic
└── recipes.json     # 20 sample recipes
```

## Recipes

20 recipes across a range of cuisines, categories, and dietary flags:

| # | Name | Cuisine | Category | Difficulty | Veg | Vegan | GF |
|---|------|---------|----------|------------|-----|-------|----|
| 1 | Spaghetti Carbonara | Italian | Dinner | Medium | ✓ | | |
| 2 | Chicken Tikka Masala | Indian | Dinner | Medium | | | |
| 3 | Avocado Toast | American | Breakfast | Easy | ✓ | ✓ | |
| 4 | Beef Tacos | Mexican | Dinner | Easy | | | |
| 5 | Greek Salad | Mediterranean | Lunch | Easy | ✓ | | ✓ |
| 6 | Pad Thai | Asian | Dinner | Medium | | | ✓ |
| 7 | Chocolate Lava Cake | French | Dessert | Hard | ✓ | | |
| 8 | Veggie Stir Fry | Asian | Dinner | Easy | ✓ | ✓ | ✓ |
| 9 | Banana Pancakes | American | Breakfast | Easy | ✓ | | |
| 10 | Margherita Pizza | Italian | Dinner | Medium | ✓ | | |
| 11 | Black Bean Soup | Mexican | Lunch | Easy | ✓ | ✓ | ✓ |
| 12 | Salmon Teriyaki | Asian | Dinner | Medium | | | ✓ |
| 13 | French Onion Soup | French | Lunch | Medium | ✓ | | |
| 14 | Mango Smoothie Bowl | American | Breakfast | Easy | ✓ | ✓ | ✓ |
| 15 | Lamb Kofta | Mediterranean | Dinner | Medium | | | ✓ |
| 16 | Tiramisu | Italian | Dessert | Hard | ✓ | | |
| 17 | Chicken Quesadilla | Mexican | Lunch | Easy | | | |
| 18 | Mushroom Risotto | Italian | Dinner | Hard | ✓ | | |
| 19 | Green Curry | Asian | Dinner | Medium | ✓ | ✓ | ✓ |
| 20 | Classic Cheesecake | American | Dessert | Hard | ✓ | | |

## Recipe Data Schema

Each recipe in `recipes.json` follows this structure:

```json
{
  "id": 1,
  "name": "Spaghetti Carbonara",
  "image": "https://picsum.photos/seed/SpaghettiCarbonara/800/500",
  "description": "...",
  "ingredients": ["200g spaghetti", "..."],
  "instructions": ["Boil water...", "..."],
  "prepTime": "15 mins",
  "cookTime": "20 mins",
  "totalTime": "35 mins",
  "servings": 2,
  "calories": 620,
  "cuisine": "Italian",
  "category": "Dinner",
  "difficulty": "Medium",
  "vegetarian": true,
  "vegan": false,
  "glutenFree": false,
  "nutrition": {
    "protein": "28g",
    "carbs": "72g",
    "fat": "22g",
    "fiber": "3g",
    "sugar": "2g",
    "sodium": "480mg"
  },
  "tips": ["Use room temperature eggs to prevent scrambling", "..."]
}
```

## Filters

Filters are combinable. Within the same type they act as OR; across types they act as AND (e.g. selecting "Vegetarian" + "Italian" shows vegetarian Italian recipes).

| Group | Options |
|-------|---------|
| Category | Breakfast, Lunch, Dinner, Dessert |
| Dietary | Vegetarian, Vegan, Gluten Free |
| Cuisine | Italian, Mexican, Asian |
| Difficulty | Easy, Medium, Hard |

## Technical Notes

- **No build step** — open `index.html` directly in a browser or serve with any static file server
- **No frameworks** — pure ES6+ JavaScript, CSS custom properties, CSS Grid and Flexbox
- **localStorage keys**: `favorites` (array of IDs), `recentRecipes` (array of IDs, max 5), `darkMode` (boolean)
- **Recipe of the Day formula**: `dayOfYear % recipes.length` — consistent across all visitors
- **Images**: served from [picsum.photos](https://picsum.photos) using recipe name as seed for consistency

## Running Locally

No installation needed. Either open `index.html` directly in your browser, or use a simple local server to avoid any CORS issues with the JSON fetch:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Browser Support

All modern browsers. The Web Share API falls back to clipboard copy on unsupported browsers. No polyfills required.
