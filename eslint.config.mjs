import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import promise from "eslint-plugin-promise";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import unicorn from "eslint-plugin-unicorn";

const ROUTE_FILES = [
    "src/pages/voice-new/**/*.{ts,tsx}",
    "src/pages/voice-new-create/**/*.{ts,tsx}",
    "src/lib/livekit/**/*.{ts,tsx}",
];

const TSCONFIG_ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));

const promiseRecommendedRules =
    promise.configs?.["flat/recommended"]?.rules ?? promise.configs?.recommended?.rules ?? {};
const unicornRecommendedRules =
    unicorn.configs?.["flat/recommended"]?.rules ?? unicorn.configs?.recommended?.rules ?? {};

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
    {
        files: ROUTE_FILES,
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                tsconfigRootDir: TSCONFIG_ROOT_DIR,
                project: ["./tsconfig.json"],
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            promise,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            unicorn,
        },
        rules: {
            // Baseline sanity for TS/React code (kept intentionally light).
            ...tseslint.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...promiseRecommendedRules,
            ...unicornRecommendedRules,

            // Vite + React refresh expects only exporting components/hooks from modules.
            "react-refresh/only-export-components": [
                "error",
                { allowConstantExport: true },
            ],

            // Existing code uses `any` in a few places; keep signal focused on React/TS hygiene.
            // "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "no-unused-vars": "off",

            // With `--max-warnings 0`, treat this as a real failure signal.
            "react-hooks/exhaustive-deps": "error",
            "react-hooks/set-state-in-effect": "off",

            // TypeScript handles this better than ESLint's base rule in TS files.
            "no-undef": "off",

            // Unicorn: keep high-signal bug-prevention rules ON (via recommended),
            // and opt out of the ones that are mostly taste/too noisy for this codebase.
            // "unicorn/prevent-abbreviations": "off",
            // "unicorn/filename-case": "off",
            "unicorn/no-null": "off",
            // "unicorn/prefer-global-this": "off",
            // "unicorn/no-negated-condition": "off",
            // "unicorn/catch-error-name": "off",
            // "unicorn/no-array-callback-reference": "off",
            // "unicorn/no-array-sort": "off",
            // "unicorn/no-array-for-each": "off",
            // "unicorn/prefer-spread": "off",
            // "unicorn/prefer-ternary": "off",
            // "unicorn/prefer-array-some": "off",
            // "unicorn/switch-case-braces": "off",
            // "unicorn/no-zero-fractions": "off",

            // Promise defaults are useful; keep only the noisiest ones disabled.
            // "promise/no-nesting": "off",
            // "promise/always-return": "off",
        },
    },
];
