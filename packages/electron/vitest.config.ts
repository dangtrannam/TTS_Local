import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/security/ipc-validation.test.ts'],
    testTimeout: 15000,
    globals: true,
    environment: 'node',
  },
});
