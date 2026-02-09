import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project artifacts / backups:
    "node_modules/**",
    "dist/**",
    "playwright-report/**",
    "test-results/**",
    "**/*.bak",
    "api-vite-bak/**",
    "recruitos-components-bak/**",
    "docs/archive/**",
    "search_page",
    "wizard_before",
  ]),
]);

export default eslintConfig;
