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

  // Turn off `no-explicit-any` ONLY for these map UI files
  {
    files: [
      "src/components/map/NavigationOverlay.tsx",
      "src/components/map/MapboxTourMapNavigation.tsx",
      "src/components/geo/GeoWatcher.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
