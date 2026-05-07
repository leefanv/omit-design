import js from "@eslint/js";
import tseslint from "typescript-eslint";
import omitDesign from "@omit-design/eslint-plugin";

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".vite/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // 三条硬规则只对 design/**/*.tsx 生效;app/ mock/ preset/ 不约束
    files: ["design/**/*.tsx"],
    plugins: { "omit-design": omitDesign },
    rules: {
      "omit-design/no-design-literal": "error",
      "omit-design/whitelist-ds-import": [
        "error",
        { presets: ["@omit-design/preset-mobile"] },
      ],
      "omit-design/require-pattern-header": "error",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
