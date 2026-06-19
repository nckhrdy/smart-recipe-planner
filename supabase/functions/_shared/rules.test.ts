import type { Recipe } from './schema.ts';
import {
  filterAllergenFree,
  findAllergen,
  isAllergenIngredient,
  normalizeTitle,
  process,
  selectDistinct,
  signature,
} from './rules.ts';

// Minimal recipe factory — only the fields the rules touch matter.
function recipe(partial: Partial<Recipe> & { title: string }): Recipe {
  return {
    hook: 'A quick weeknight dish.',
    dishType: 'skillet',
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 2,
    ingredients: [{ name: 'tomato', amount: 2, unit: null, note: null }],
    steps: ['Cook it.'],
    tags: ['Dinner'],
    ...partial,
  };
}

describe('normalizeTitle', () => {
  it('should collapse word order and casing when the concept is the same', () => {
    expect(normalizeTitle('Garlic Tomato Pasta')).toBe(normalizeTitle('Tomato Garlic Pasta'));
    expect(normalizeTitle('GARLIC tomato, pasta!')).toBe(normalizeTitle('pasta garlic tomato'));
  });

  it('should keep genuinely different dishes distinct', () => {
    expect(normalizeTitle('Spinach Frittata')).not.toBe(normalizeTitle('Shakshuka'));
  });

  it('should drop stop-words so they never carry the signature', () => {
    expect(normalizeTitle('Eggs in a Skillet')).toBe(normalizeTitle('Skillet Eggs'));
  });
});

describe('signature', () => {
  it('should equate reorderings (happy path)', () => {
    expect(signature('Spicy Garlic Noodles')).toBe(signature('Garlic Spicy Noodles'));
  });
});

describe('selectDistinct', () => {
  it('should drop recipes already shown (by concept) and add server fields', () => {
    const batch = [recipe({ title: 'Tomato Garlic Pasta' }), recipe({ title: 'Spinach Frittata' })];
    const kept = selectDistinct(batch, ['Garlic Tomato Pasta']); // same concept, different order

    expect(kept).toHaveLength(1);
    expect(kept[0].title).toBe('Spinach Frittata');
    expect(kept[0].signature).toBe(signature('Spinach Frittata'));
    expect(kept[0].totalMinutes).toBe(25); // prep 10 + cook 15
  });

  it('should drop in-batch duplicates that share a concept (edge case)', () => {
    const batch = [recipe({ title: 'Garlic Tomato Pasta' }), recipe({ title: 'Tomato Garlic Pasta' })];
    const kept = selectDistinct(batch, []);
    expect(kept).toHaveLength(1);
  });
});

describe('findAllergen / filterAllergenFree', () => {
  it('should catch a literal allergen term in an ingredient (happy path)', () => {
    const r = recipe({
      title: 'Satay Noodles',
      ingredients: [{ name: 'peanut butter', amount: 2, unit: 'tbsp', note: null }],
    });
    expect(findAllergen(r, ['peanut'])).toBe('peanut');
  });

  it('should catch an allergen via its synonym group (dairy → cheese)', () => {
    const r = recipe({
      title: 'Three Cheese Bake',
      ingredients: [{ name: 'cheddar', amount: 1, unit: 'cup', note: null }],
    });
    expect(findAllergen(r, ['dairy'])).toBe('dairy');
  });

  it('should return null when the recipe is safe (edge case)', () => {
    const r = recipe({ title: 'Garden Salad' });
    expect(findAllergen(r, ['peanut', 'shellfish'])).toBeNull();
  });

  it('should pass everything through when the allergy list is empty', () => {
    const batch = [recipe({ title: 'Peanut Stew' })];
    expect(filterAllergenFree(batch, [])).toHaveLength(1);
  });

  it('should drop only the unsafe recipes from a batch', () => {
    const batch = [
      recipe({ title: 'Shrimp Tacos', ingredients: [{ name: 'shrimp', amount: 200, unit: 'g', note: null }] }),
      recipe({ title: 'Veggie Tacos' }),
    ];
    const safe = filterAllergenFree(batch, ['shellfish']);
    expect(safe.map((r) => r.title)).toEqual(['Veggie Tacos']);
  });
});

describe('isAllergenIngredient', () => {
  it('should flag an ingredient that is itself an allergen (happy path)', () => {
    expect(isAllergenIngredient('cheddar', ['dairy'])).toBe(true);
    expect(isAllergenIngredient('peanut butter', ['peanut'])).toBe(true);
  });

  it('should not flag safe ingredients (edge case)', () => {
    expect(isAllergenIngredient('tomato', ['dairy', 'shellfish'])).toBe(false);
    expect(isAllergenIngredient('cheddar', [])).toBe(false);
  });
});

describe('process (combined pass)', () => {
  it('should apply exclusion AND the allergy guard together', () => {
    const batch = [
      recipe({ title: 'Tomato Garlic Pasta' }), // excluded by signature
      recipe({ title: 'Cheesy Omelette', ingredients: [{ name: 'cheese', amount: 1, unit: 'cup', note: null }] }), // dairy
      recipe({ title: 'Spinach Frittata' }), // survives
    ];
    const out = process(batch, { excludeTitles: ['Garlic Tomato Pasta'], allergies: ['dairy'] });

    expect(out.map((r) => r.title)).toEqual(['Spinach Frittata']);
    expect(out[0].totalMinutes).toBe(25);
  });
});
