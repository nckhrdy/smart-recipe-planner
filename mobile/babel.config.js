/**
 * Babel config. Mirrors Expo's default (`babel-preset-expo`) — which we now have
 * to declare explicitly since this file overrides the auto-applied default — plus
 * one targeted fix:
 *
 * zustand v5's ESM middleware (`zustand/esm/middleware.mjs`) references
 * `import.meta.env` (a Vite-ism). Metro transforms node_modules and emits the web
 * bundle as a CLASSIC script, where `import.meta` is a hard SyntaxError → the
 * whole bundle fails to parse → blank screen. We rewrite any `import.meta` to an
 * empty object so `import.meta.env?.MODE` safely evaluates to undefined. Harmless
 * on native (Hermes also lacks `import.meta`; the only usage is a devtools no-op).
 */
function replaceImportMeta({ types: t }) {
  return {
    name: 'replace-import-meta',
    visitor: {
      MetaProperty(path) {
        if (path.node.meta?.name === 'import' && path.node.property?.name === 'meta') {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [replaceImportMeta],
  };
};
