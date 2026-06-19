-- 0001_init — profiles + saved_recipes with Row-Level Security
-- Topology: ADR-0005. Data model mirrors the "Data model (Postgres)" section there.
-- Authorization lives here (RLS), not in client code: every row is scoped to its owner.

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth user. Holds onboarding prefs (soft bias) + allergies (hard guard).
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  cuisines   text[] not null default '{}',   -- preference bias (ADR-0002 prefs)
  diets      text[] not null default '{}',   -- e.g. vegetarian, vegan
  allergies  text[] not null default '{}',   -- HARD check in the recipes function
  updated_at timestamptz not null default now()
);

-- ── saved_recipes ───────────────────────────────────────────────────────────
-- Keepers. The full recipe object (ADR-0003) is stored verbatim as jsonb so a
-- saved recipe survives schema drift and never needs Claude to re-render.
create table if not exists public.saved_recipes (
  id         uuid primary key default gen_random_uuid (),
  user_id    uuid not null references auth.users (id) on delete cascade,
  recipe     jsonb not null,
  title      text  not null,
  dish_type  text,
  created_at timestamptz not null default now()
);

create index if not exists saved_recipes_user_id_created_idx
  on public.saved_recipes (user_id, created_at desc);

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- Default-deny once enabled; the policies below grant a user access to ONLY
-- their own rows. The client uses the anon key — safe because it can't escape RLS.
alter table public.profiles      enable row level security;
alter table public.saved_recipes enable row level security;

-- profiles: owner can do everything to their single row.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid () = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid () = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid () = user_id) with check (auth.uid () = user_id);

-- saved_recipes: owner-scoped CRUD.
create policy "saved_recipes_select_own" on public.saved_recipes
  for select using (auth.uid () = user_id);
create policy "saved_recipes_insert_own" on public.saved_recipes
  for insert with check (auth.uid () = user_id);
create policy "saved_recipes_delete_own" on public.saved_recipes
  for delete using (auth.uid () = user_id);

-- ── keep profiles.updated_at honest ─────────────────────────────────────────
create or replace function public.touch_updated_at ()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now ();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at ();
