import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // Todos los archivos comparten la misma base de datos de pruebas: en serie
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
