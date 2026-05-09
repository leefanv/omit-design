import noDesignLiteral from "./rules/no-design-literal.js";
import whitelistDsImport from "./rules/whitelist-ds-import.js";
import requirePatternHeader from "./rules/require-pattern-header.js";
import requirePatternComponents from "./rules/require-pattern-components.js";

export default {
  meta: { name: "@omit-design/eslint-plugin", version: "0.2.0" },
  rules: {
    "no-design-literal": noDesignLiteral,
    "whitelist-ds-import": whitelistDsImport,
    "require-pattern-header": requirePatternHeader,
    "require-pattern-components": requirePatternComponents,
  },
};
