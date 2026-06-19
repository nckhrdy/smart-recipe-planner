// POST /vision — Call 1 of the pipeline (ADR-0002): photo(s) → structured
// ingredient catalog. Auth is handled by the Supabase gateway (a valid JWT —
// the app's anon/publishable key at minimum — is required), so this stays a
// thin, authenticated proxy. Input is validated at the boundary.

import { callClaudeStructured, ClaudeError, type ContentBlock } from '../_shared/claude.ts';
import { INGREDIENT_CATALOG_SCHEMA, type IngredientCatalog } from '../_shared/schema.ts';
import { CORS_HEADERS, errorResponse, json } from '../_shared/cors.ts';

const MAX_IMAGES = 5;
const ALLOWED_MEDIA = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const SYSTEM = `You catalog the food ingredients visible in one or more photos of someone's kitchen or fridge.
Return clean, canonical, singular food nouns ("tomato", "egg", "cheddar"). Ignore brands, packaging text, and non-food items.
Give a count for discrete countable items (6 eggs, 2 onions); use null for loose or bulk items (spinach, rice, oil).
Merge duplicates across photos into a single entry.`;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405);

  let body: { images?: Array<{ data?: unknown; mediaType?: unknown }> };
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const images = body?.images;
  if (!Array.isArray(images) || images.length === 0) {
    return errorResponse('`images` must be a non-empty array');
  }
  if (images.length > MAX_IMAGES) return errorResponse(`At most ${MAX_IMAGES} images per request`);
  for (const img of images) {
    if (typeof img?.data !== 'string' || img.data.length === 0) {
      return errorResponse('Each image needs base64 `data`');
    }
    if (typeof img?.mediaType !== 'string' || !ALLOWED_MEDIA.has(img.mediaType)) {
      return errorResponse('Each image needs a supported `mediaType` (jpeg, png, webp, gif)');
    }
  }

  const content: ContentBlock[] = [
    ...images.map((img) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: img.mediaType as string, data: img.data as string },
    })),
    { type: 'text', text: 'Catalog every food ingredient you can identify across these photos.' },
  ];

  try {
    const result = await callClaudeStructured<IngredientCatalog>({
      system: SYSTEM,
      content,
      schema: INGREDIENT_CATALOG_SCHEMA,
      maxTokens: 1500,
    });

    // Defensive normalization before it reaches the UI.
    const ingredients = (result.ingredients ?? [])
      .filter((i) => typeof i?.name === 'string' && i.name.trim().length > 0)
      .map((i) => ({
        name: i.name.trim().toLowerCase(),
        count: typeof i.count === 'number' && i.count > 0 ? Math.round(i.count) : null,
      }));

    return json({ ingredients });
  } catch (err) {
    const status = err instanceof ClaudeError ? err.status : 502;
    return errorResponse(err instanceof Error ? err.message : 'Vision request failed', status);
  }
});
