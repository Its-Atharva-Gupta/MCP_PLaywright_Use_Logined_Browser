import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const PROFILE_DIR = path.join(os.homedir(), ".playwright-agent-profile");

const DEFAULT_CHROMIUM_CANDIDATES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium"
];

export interface BrowserLaunchConfig {
  executablePath?: string;
  headless: boolean;
  profileDir: string;
  browserArgs: string[];
}

export function resolveBrowserLaunchConfig(headless: boolean): BrowserLaunchConfig {
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    DEFAULT_CHROMIUM_CANDIDATES.find((candidate) => fs.existsSync(candidate));

  return {
    executablePath,
    headless,
    profileDir: process.env.PLAYWRIGHT_AGENT_PROFILE_DIR ?? PROFILE_DIR,
    browserArgs: buildChromiumArgs()
  };
}

function buildChromiumArgs(): string[] {
  const args = [
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--enable-features=UseOzonePlatform",
    "--no-first-run",
    "--no-default-browser-check",
    "--password-store=basic"
  ];

  if (process.env.PLAYWRIGHT_AGENT_NO_SANDBOX === "1") {
    args.push("--no-sandbox", "--disable-setuid-sandbox");
  }

  return args;
}
