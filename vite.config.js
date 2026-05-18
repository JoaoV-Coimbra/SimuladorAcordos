import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Configura o Vite para rodar o front React sempre no mesmo host/porta local.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
