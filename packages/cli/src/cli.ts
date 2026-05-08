#!/usr/bin/env node
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "omit-design",
    version: "0.1.2",
    description: [
      "AI-collaborative design composition framework — write TSX, lint with hard rules, preview locally.",
      "",
      "Quick start:",
      "  npx omit-design init my-app",
      "  cd my-app && npm install",
      "  npm run dev",
      "",
    ].join("\n"),
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    dev: () => import("./commands/dev.js").then((m) => m.default),
    lint: () => import("./commands/lint.js").then((m) => m.default),
    skills: () => import("./commands/skills.js").then((m) => m.default),
    "new-page": () => import("./commands/new-page.js").then((m) => m.default),
  },
});

runMain(main);
