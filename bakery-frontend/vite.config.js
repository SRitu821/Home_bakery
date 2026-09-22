import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:8000',
      '/register': 'http://localhost:8000',
      '/login': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
      '/categories': 'http://localhost:8000',
      '/products': 'http://localhost:8000',
      '/popular': 'http://localhost:8000',
      '/cart': 'http://localhost:8000',
      '/orders': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
    },
  },
});
