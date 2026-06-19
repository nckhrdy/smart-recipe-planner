// Quiz + profile option lists. Allergen labels line up with the server's
// synonym groups (rules.ts) — the server lowercases, so Title Case is fine.

export const CUISINES = [
  'Italian',
  'Mexican',
  'Indian',
  'Chinese',
  'Thai',
  'Japanese',
  'Mediterranean',
  'American',
  'French',
  'Korean',
  'Middle Eastern',
  'Greek',
];

export const DIETS = ['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Gluten-free'];

export const ALLERGENS = ['Dairy', 'Egg', 'Peanut', 'Tree nut', 'Shellfish', 'Fish', 'Gluten', 'Soy', 'Sesame'];

// Curated tap-to-pick list for the Confirm "+ Add" picker — preserves the
// no-typing promise (screens.md): a common-pantry set the user taps to add,
// rather than free text. Lowercased to match the draft ingredient model.
export const COMMON_INGREDIENTS = [
  'eggs', 'milk', 'butter', 'cheddar', 'parmesan', 'yogurt',
  'chicken', 'beef', 'pork', 'bacon', 'tofu', 'salmon',
  'onion', 'garlic', 'tomato', 'spinach', 'potato', 'carrot',
  'bell pepper', 'mushroom', 'broccoli', 'lemon', 'lime', 'avocado',
  'rice', 'pasta', 'bread', 'flour', 'tortilla', 'oats',
  'olive oil', 'soy sauce', 'basil', 'cilantro', 'ginger', 'chili',
];
