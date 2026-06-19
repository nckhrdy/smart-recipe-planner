#!/usr/bin/env bash
# One-shot cleanup: remove the create-expo-app demo files that our app replaced.
# None of these are imported by our code; the two app/ ones are stale routes that
# collide with the new (app)/(tabs) structure. Safe to delete this script after.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -f \
  src/app/explore.tsx \
  src/app/index.tsx \
  src/components/app-tabs.tsx \
  src/components/app-tabs.web.tsx \
  src/components/animated-icon.tsx \
  src/components/animated-icon.web.tsx \
  src/components/animated-icon.module.css \
  src/components/hint-row.tsx \
  src/components/web-badge.tsx \
  src/components/external-link.tsx \
  src/components/themed-text.tsx \
  src/components/themed-view.tsx \
  src/components/ui/collapsible.tsx \
  src/hooks/use-theme.ts \
  src/hooks/use-color-scheme.ts \
  src/hooks/use-color-scheme.web.ts \
  src/constants/theme.ts \
  src/global.css

rmdir src/hooks src/constants 2>/dev/null || true

echo "✓ Removed 18 template demo files."
