import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const [, , command = "dev", ...args] = process.argv;
const isDev = command === "dev";

loadEnvConfig(process.cwd(), isDev);

const nextBin = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);

const child = spawn(process.execPath, [nextBin, command, ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
