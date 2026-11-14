import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  sortImports: {
    customGroups: [
      {
        elementNamePattern: ["react", "react/**", "react-dom", "react-dom/**"],
        groupName: "react",
      },
    ],
    groups: [
      "type-builtin",
      "value-builtin",
      "react",
      "type-external",
      "value-external",
      ["type-internal", "type-subpath"],
      ["value-internal", "value-subpath"],
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "style",
      "unknown",
    ],
    internalPattern: ["#/"],
    newlinesBetween: false,
  },
  sortPackageJson: {
    sortScripts: true,
  },
  sortTailwindcss: {
    stylesheet: "./src/app/globals.css",
  },
  tabWidth: 2,
  trailingComma: "all",
});
