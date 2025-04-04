/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Use Vitest globals (describe, it, expect)
    environment: 'jsdom', // Simulate browser environment
    setupFiles: './src/tests/setup.ts', // Optional setup file
    css: false, // Disable CSS processing if not needed
  },
  resolve: {
    alias: {
      // Ensure this alias matches your tsconfig.json
      '@': path.resolve(__dirname, './src'),
    },
  },
});
