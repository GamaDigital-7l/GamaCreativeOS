import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Expose Supabase project ID and URL to the client
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://wazymrsugupnogtcddpq.supabase.co"),
    'import.meta.env.VITE_SUPABASE_FUNCTIONS_URL': JSON.stringify("https://wazymrsugupnogtcddpq.supabase.co/functions/v1"),
  },
}));