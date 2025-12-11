import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // We no longer need to manually define process.env.API_KEY
  // provided we use VITE_API_KEY and import.meta.env in the code.
});