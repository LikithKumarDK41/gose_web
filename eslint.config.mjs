import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Next.js + TypeScript base configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Optional: ignore build artifacts
  { ignores: [".next/**", "out/**", "node_modules/**"] },

  // ✅ Turn off no-explicit-any globally
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
