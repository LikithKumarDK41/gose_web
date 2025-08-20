// tailwind.config.ts
import type { Config } from "tailwindcss";
export default {
    content: [
        "./src/app/**/*.{ts,tsx}",
        "./src/components/**/*.{ts,tsx}",
        "./src/lib/**/*.{ts,tsx}",
    ],
    // dark mode handled by your @custom-variant; no need to set here for v4
    theme: { extend: {} },
    plugins: [],
} satisfies Config;
