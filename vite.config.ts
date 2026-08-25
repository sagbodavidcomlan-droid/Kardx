import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import express from 'express';
import { createApiRouter } from './src/services/apiRouter';

const apiPlugin = (): Plugin => ({
  name: 'kardx-api-server',
  configureServer(server) {
    const app = express();
    app.use('/api', createApiRouter());
    server.middlewares.use(app);
  },
  configurePreviewServer(server) {
    const app = express();
    app.use('/api', createApiRouter());
    server.middlewares.use(app);
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
