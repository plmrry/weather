import { defineConfig } from "oxlint";

export default defineConfig({
  env: {
    browser: true,
    node: true,
  },
  jsPlugins: ["eslint-plugin-perfectionist"],
  plugins: ["oxc", "typescript", "unicorn", "import"],
  rules: {
    "import/consistent-type-specifier-style": ["warn", "prefer-top-level"],
    "no-restricted-imports": [
      "warn",
      {
        paths: [
          {
            allowImportNames: ["default"],
            message: 'Use `import React from "react"` and `React.X`.',
            name: "react",
          },
        ],
      },
    ],
    "perfectionist/sort-array-includes": "warn",
    "perfectionist/sort-arrays": "warn",
    "perfectionist/sort-classes": "warn",
    "perfectionist/sort-decorators": "warn",
    "perfectionist/sort-enums": "warn",
    "perfectionist/sort-export-attributes": "warn",
    "perfectionist/sort-exports": "warn",
    "perfectionist/sort-heritage-clauses": "warn",
    "perfectionist/sort-import-attributes": "warn",
    "perfectionist/sort-interfaces": "warn",
    "perfectionist/sort-intersection-types": "warn",
    "perfectionist/sort-jsx-props": "warn",
    "perfectionist/sort-maps": "warn",
    "perfectionist/sort-named-exports": "warn",
    "perfectionist/sort-named-imports": "warn",
    "perfectionist/sort-object-types": "warn",
    "perfectionist/sort-objects": "warn",
    "perfectionist/sort-sets": "warn",
    "perfectionist/sort-switch-case": "warn",
    "perfectionist/sort-union-types": "warn",
    "perfectionist/sort-variable-declarations": "warn",
    "sort-keys": "error",
  },
});
