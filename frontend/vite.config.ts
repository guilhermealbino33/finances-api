import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig({
  server: {
    host: '::',
    port: 8081,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@finances/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
});
