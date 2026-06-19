// Client-side mirror of the server contract (ADR-0003). Recipe carries the
// server-computed fields (id, totalMinutes, signature) the functions add.

export interface Ingredient {
  name: string;
  count: number | null;
}

export interface RecipeIngredient {
  name: string;
  amount: number | null;
  unit: string | null;
  note: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  hook: string;
  dishType: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  signature: string;
}

export interface VisionResult {
  ingredients: Ingredient[];
}

export interface RecipesResult {
  recipes: Recipe[];
  exhausted: boolean;
}

export interface CapturedImage {
  data: string; // base64, no data: prefix
  mediaType: string; // image/jpeg, image/png, ...
  uri?: string; // local uri for thumbnail display — stripped before upload
}
