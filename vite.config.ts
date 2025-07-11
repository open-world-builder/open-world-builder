import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fullReload from 'vite-plugin-full-reload';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fullReload(['public/**/*'])],
});
