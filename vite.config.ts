import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  //githubpages設定
  base: process.env.GITHUB_PAGES ? 'hide-hate-frontend' : './',
  plugins: [react()],
});
