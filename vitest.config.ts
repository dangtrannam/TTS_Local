import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    exclude: [
      '**/node_modules/**',
      '**/__tests__/e2e/**',
      '**/packages/electron/__tests__/security/csp-enforcement.test.ts',
      '**/packages/electron/__tests__/security/sandbox-isolation.test.ts',
      '**/packages/electron/__tests__/security/preload-surface-area.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/index.ts', '**/__tests__/**'],
      // TODO: Increase to 70% after adding unit tests for CLI commands and Electron main
      // Currently at 46% due to integration/E2E-tested code not counted in unit coverage
      thresholds: {
        lines: 45,
        functions: 45,
        branches: 45,
        statements: 45,
      },
    },
  },
});
