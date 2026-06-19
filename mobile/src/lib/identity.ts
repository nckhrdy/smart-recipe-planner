/**
 * The display identity shown in the topbar avatar, Home greeting, and Profile.
 * Derived from the Supabase session when signed in; under the dev bypass (no
 * real session yet — see session.tsx) it falls back to a demo identity so the
 * shell looks real. Replace the fallback once Google OAuth lands.
 */
import { useSession } from '@/lib/session';

export interface Identity {
  name: string;
  firstName: string;
  email: string;
  provider: string;
  initial: string;
}

const DEMO: Identity = { name: 'Nick Hardy', firstName: 'Nick', email: 'nick@example.com', provider: 'Google', initial: 'N' };

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function useIdentity(): Identity {
  const { session } = useSession();
  const user = session?.user;
  if (!user?.email) return DEMO;

  const meta = user.user_metadata ?? {};
  const fullName = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
  const name = fullName ?? titleCase(user.email.split('@')[0]);
  const provider = (user.app_metadata?.provider as string | undefined) ?? 'Google';
  return {
    name,
    firstName: name.split(' ')[0],
    email: user.email,
    provider: titleCase(provider),
    initial: (name.trim()[0] ?? 'A').toUpperCase(),
  };
}
