#!/usr/bin/env node

import process from "node:process";
import { createHeadlessBrowserManager, createInteractiveBrowserManager } from "./browser.js";
import { startMcpServer } from "./server.js";

function printUsage(): void {
  console.error(
    [
      "Usage:",
      "  playwright-persistent-mcp login",
      "  playwright-persistent-mcp serve",
      "",
      "Commands:",
      "  login  Launch Chromium with the persistent profile for manual sign-in.",
      "  serve  Launch headless Chromium and start the MCP server on stdio."
    ].join("\n")
  );
}

async function runLogin(): Promise<void> {
  const browser = createInteractiveBrowserManager();
  await browser.start();

  console.error(`Persistent profile: ${browser.getProfileDir()}`);
  console.error(`Chromium executable: ${browser.getExecutablePath() ?? "Playwright default"}`);
  console.error("Chromium is open with your persistent profile.");
  console.error("Log into any sites you want the agent to reuse, then close the browser window.");

  await browser.waitUntilClosed();
}

async function runServe(): Promise<void> {
  const browser = createHeadlessBrowserManager();
  await browser.start();

  const shutdown = async () => {
    await browser.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.error(`Persistent profile: ${browser.getProfileDir()}`);
  console.error(`Chromium executable: ${browser.getExecutablePath() ?? "Playwright default"}`);
  console.error("Starting MCP server over stdio with headless Chromium.");

  await startMcpServer(browser);
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? "serve";

  if (command === "login") {
    await runLogin();
    return;
  }

  if (command === "serve") {
    await runServe();
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
