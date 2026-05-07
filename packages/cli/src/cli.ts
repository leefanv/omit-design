#!/usr/bin/env node
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "omit-design",
    version: "0.1.0",
    description: "AI-collaborative design composition framework — write TSX, lint with hard rules, preview locally.",
  },
  subCommands: {
    init: () => import("./commands/init.js").then((m) => m.default),
    dev: () => import("./commands/dev.js").then((m) => m.default),
    lint: () => import("./commands/lint.js").then((m) => m.default),
  },
});

runMain(main);
