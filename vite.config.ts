import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ command, mode }) => {
  if (command === "serve" && mode !== "test") {
    // Development-specific config
    return {
      root: "./demo",
      plugins: [vue()],
    };
  } else {
    // Build-specific config
    return {
      build: {
        target: "esnext",
        lib: {
          entry: "src/index.ts",
          formats: ["es"],
        },
        minify: false,
      },
      test: {
        includeSource: ["src/**/*.ts"],
      },
      define: {
        // Remove test code for production builds
        "import.meta.vitest": "undefined",
      },
    };
  }
});
