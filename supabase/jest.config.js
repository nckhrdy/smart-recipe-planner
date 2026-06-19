/**
 * Tests the PURE rule layer (rules.ts) in Node. The functions run on Deno in
 * prod, but the rules are I/O-free TypeScript, so Node/jest exercises them
 * faithfully without requiring a Deno toolchain. (Type-checking the Deno
 * functions themselves is `deno check`'s job — a CI lever.)
 *
 * The shared files use Deno-style `.ts` import extensions; `isolatedModules`
 * transpile-only skips the type-check that would reject them, and
 * `moduleNameMapper` strips the extension so jest resolves the file.
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/functions'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  testMatch: ['**/*.test.ts'],
};
