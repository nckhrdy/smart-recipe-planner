// Claude Messages API wrapper (raw fetch — Deno runtime, no SDK).
// Structured output via output_config.format (GA), Sonnet 4.6, with retry/backoff
// on rate-limit + transient errors. The ANTHROPIC_API_KEY lives only here, as an
// Edge Function secret (ADR-0005) — never in the client.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
/**
 * Model lever (refines ADR-0002 from measured latency): Sonnet 4.6 for vision
 * (accuracy on a fridge photo — a one-off per session), Haiku 4.5 for generation
 * (fast + cheap on the repeated Refresh). Both are vision- and
 * structured-output-capable.
 */
export const MODELS = { vision: 'claude-sonnet-4-6', generate: 'claude-haiku-4-5' } as const;
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_ATTEMPTS = 3;
const RETRYABLE = new Set([429, 500, 502, 503, 529]);

export class ClaudeError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = 'ClaudeError';
    this.status = status;
  }
}

export type ImageBlock = {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
};
export type TextBlock = { type: 'text'; text: string };
export type ContentBlock = ImageBlock | TextBlock;

interface StructuredCallOptions {
  system?: string;
  content: ContentBlock[];
  schema: unknown;
  maxTokens: number;
  model?: string; // defaults to the vision model
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One structured-output call. The API guarantees the response is valid JSON
 * matching `schema`; we still parse defensively and surface typed errors so a
 * malformed payload can never reach the UI (ADR-0002).
 */
export async function callClaudeStructured<T>(opts: StructuredCallOptions): Promise<T> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new ClaudeError('ANTHROPIC_API_KEY is not configured', 500);

  const body = JSON.stringify({
    model: opts.model ?? MODELS.vision,
    max_tokens: opts.maxTokens,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: 'user', content: opts.content }],
    output_config: { format: { type: 'json_schema', schema: opts.schema } },
  });

  let lastError: ClaudeError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.stop_reason === 'refusal') throw new ClaudeError('Claude declined the request', 422);
      if (data.stop_reason === 'max_tokens') throw new ClaudeError('Response was truncated', 502);

      const text = (data.content ?? []).find((b: { type: string }) => b.type === 'text')?.text;
      if (!text) throw new ClaudeError('Empty response from Claude', 502);
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ClaudeError('Claude returned malformed JSON', 502);
      }
    }

    const detail = (await res.text()).slice(0, 300);
    lastError = new ClaudeError(`Claude API ${res.status}: ${detail}`, res.status);

    if (!RETRYABLE.has(res.status) || attempt === MAX_ATTEMPTS) break;
    const retryAfter = Number(res.headers.get('retry-after'));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 400 * 2 ** (attempt - 1));
  }

  throw lastError ?? new ClaudeError('Claude request failed', 502);
}
