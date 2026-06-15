import fs from "node:fs/promises";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { resolveBrowserLaunchConfig, type BrowserLaunchConfig } from "./config.js";

export interface TabInfo {
  index: number;
  title: string;
  url: string;
  isActive: boolean;
}

export class PersistentBrowserManager {
  private context?: BrowserContext;
  private activePageIndex = 0;

  constructor(private readonly launchConfig: BrowserLaunchConfig) {}

  async start(): Promise<void> {
    if (this.context) {
      return;
    }

    await fs.mkdir(this.launchConfig.profileDir, { recursive: true });

    this.context = await chromium.launchPersistentContext(this.launchConfig.profileDir, {
      executablePath: this.launchConfig.executablePath,
      headless: this.launchConfig.headless,
      args: this.launchConfig.browserArgs,
      viewport: null
    });

    if (this.context.pages().length === 0) {
      await this.context.newPage();
    }

    this.normalizeActivePageIndex();
    this.registerContextListeners();
  }

  async stop(): Promise<void> {
    if (!this.context) {
      return;
    }

    await this.context.close();
    this.context = undefined;
    this.activePageIndex = 0;
  }

  async navigate(url: string): Promise<string> {
    const page = this.getActivePage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return page.url();
  }

  async click(selector: string): Promise<void> {
    const page = this.getActivePage();
    await page.locator(selector).click();
  }

  async fill(selector: string, value: string): Promise<void> {
    const page = this.getActivePage();
    await page.locator(selector).fill(value);
  }

  async screenshot(outputPath?: string, fullPage = true): Promise<{ path?: string; base64: string }> {
    const page = this.getActivePage();
    const screenshotBuffer = await page.screenshot({
      fullPage,
      path: outputPath ? path.resolve(outputPath) : undefined,
      type: "png"
    });

    return {
      path: outputPath ? path.resolve(outputPath) : undefined,
      base64: screenshotBuffer.toString("base64")
    };
  }

  async extractText(selector = "body"): Promise<string> {
    const page = this.getActivePage();
    const text = await page.locator(selector).innerText();
    return text.trim();
  }

  async executeJavaScript(script: string): Promise<unknown> {
    const page = this.getActivePage();
    return page.evaluate((source) => {
      return (0, eval)(source);
    }, script);
  }

  async listTabs(): Promise<TabInfo[]> {
    this.ensureContext();
    const pages = this.context!.pages();
    this.normalizeActivePageIndex();

    return Promise.all(
      pages.map(async (page, index) => ({
        index,
        title: await page.title(),
        url: page.url(),
        isActive: index === this.activePageIndex
      }))
    );
  }

  async switchTab(index: number): Promise<TabInfo> {
    this.ensureContext();
    const pages = this.context!.pages();

    if (!pages[index]) {
      throw new Error(`No tab found at index ${index}.`);
    }

    this.activePageIndex = index;
    await pages[index].bringToFront();

    return {
      index,
      title: await pages[index].title(),
      url: pages[index].url(),
      isActive: true
    };
  }

  async closeTab(index?: number): Promise<{ closedIndex: number; remainingTabs: number }> {
    this.ensureContext();
    const pages = this.context!.pages();
    const targetIndex = index ?? this.activePageIndex;
    const page = pages[targetIndex];

    if (!page) {
      throw new Error(`No tab found at index ${targetIndex}.`);
    }

    if (pages.length === 1) {
      throw new Error("Refusing to close the last remaining tab in the persistent browser.");
    }

    await page.close();
    this.normalizeActivePageIndex();

    return {
      closedIndex: targetIndex,
      remainingTabs: this.context!.pages().length
    };
  }

  async openNewTab(url?: string): Promise<TabInfo> {
    this.ensureContext();
    const page = await this.context!.newPage();

    if (url) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    }

    this.activePageIndex = this.context!.pages().indexOf(page);

    return {
      index: this.activePageIndex,
      title: await page.title(),
      url: page.url(),
      isActive: true
    };
  }

  async waitUntilClosed(): Promise<void> {
    this.ensureContext();

    await new Promise<void>((resolve) => {
      this.context!.once("close", () => resolve());
    });
  }

  getProfileDir(): string {
    return this.launchConfig.profileDir;
  }

  getExecutablePath(): string | undefined {
    return this.launchConfig.executablePath;
  }

  private registerContextListeners(): void {
    this.context?.on("page", (page) => {
      this.activePageIndex = this.context!.pages().indexOf(page);
    });

    this.context?.on("close", () => {
      this.context = undefined;
      this.activePageIndex = 0;
    });
  }

  private getActivePage(): Page {
    this.ensureContext();
    const pages = this.context!.pages();

    this.normalizeActivePageIndex();

    const page = pages[this.activePageIndex];
    if (!page) {
      throw new Error("No active tab is available.");
    }

    return page;
  }

  private normalizeActivePageIndex(): void {
    this.ensureContext();
    const lastIndex = Math.max(0, this.context!.pages().length - 1);
    this.activePageIndex = Math.min(this.activePageIndex, lastIndex);
  }

  private ensureContext(): void {
    if (!this.context) {
      throw new Error("Browser context has not been started yet.");
    }
  }
}

export function createHeadlessBrowserManager(): PersistentBrowserManager {
  return new PersistentBrowserManager(resolveBrowserLaunchConfig(true));
}

export function createInteractiveBrowserManager(): PersistentBrowserManager {
  return new PersistentBrowserManager(resolveBrowserLaunchConfig(false));
}
