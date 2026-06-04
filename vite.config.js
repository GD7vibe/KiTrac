import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The "base" must match your repository name, with slashes.
// If your repo is called "kitrac", this stays as "/kitrac/".
// If you name the repo something else, change it to "/that-name/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});
