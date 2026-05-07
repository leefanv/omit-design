import { defineCommand } from "citty";
import { spawn } from "node:child_process";

export default defineCommand({
  meta: {
    name: "dev",
    description: "Start the local Vite dev server (engine shell + designs).",
  },
  args: {
    port: {
      type: "string",
      description: "Port to listen on (default: 5173).",
      default: "5173",
    },
    host: {
      type: "boolean",
      description: "Expose the dev server on the LAN.",
      default: false,
    },
  },
  async run({ args }) {
    const viteArgs = ["vite", "--port", String(args.port)];
    if (args.host) viteArgs.push("--host");

    const child = spawn("npx", viteArgs, {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });

    child.on("close", (code) => process.exit(code ?? 0));
    child.on("error", (err) => {
      process.stderr.write(`✗ vite 启动失败:${err.message}\n`);
      process.exit(1);
    });
  },
});
