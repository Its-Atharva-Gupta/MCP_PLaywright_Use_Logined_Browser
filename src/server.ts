import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { PersistentBrowserManager } from "./browser.js";

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function toolText(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text
      }
    ]
  };
}

export async function startMcpServer(browser: PersistentBrowserManager): Promise<void> {
  const server = new McpServer({
    name: "playwright-persistent-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "navigate",
    {
      description: "Navigate the active tab to a URL.",
      inputSchema: { url: z.string().url() }
    },
    async ({ url }) => {
      const finalUrl = await browser.navigate(url);
      return toolText(`Navigated to ${finalUrl}`);
    }
  );

  server.registerTool(
    "click",
    {
      description: "Click an element in the active tab using a Playwright selector.",
      inputSchema: { selector: z.string().min(1) }
    },
    async ({ selector }) => {
      await browser.click(selector);
      return toolText(`Clicked ${selector}`);
    }
  );

  server.registerTool(
    "fill",
    {
      description: "Fill an input or textarea in the active tab.",
      inputSchema: {
        selector: z.string().min(1),
        value: z.string()
      }
    },
    async ({ selector, value }) => {
      await browser.fill(selector, value);
      return toolText(`Filled ${selector}`);
    }
  );

  server.registerTool(
    "screenshot",
    {
      description: "Capture a PNG screenshot of the active tab.",
      inputSchema: {
        outputPath: z.string().optional(),
        fullPage: z.boolean().optional()
      }
    },
    async ({ outputPath, fullPage }) => {
      const result = await browser.screenshot(outputPath, fullPage ?? true);
      return toolText(formatJson(result));
    }
  );

  server.registerTool(
    "extract_text",
    {
      description: "Extract visible innerText from the active tab.",
      inputSchema: {
        selector: z.string().optional()
      }
    },
    async ({ selector }) => {
      const text = await browser.extractText(selector ?? "body");
      return toolText(text);
    }
  );

  server.registerTool(
    "execute_javascript",
    {
      description: "Execute JavaScript in the active tab and return the serializable result.",
      inputSchema: {
        script: z.string().min(1)
      }
    },
    async ({ script }) => {
      const result = await browser.executeJavaScript(script);
      return toolText(formatJson(result));
    }
  );

  server.registerTool(
    "list_tabs",
    {
      description: "List all open tabs in the persistent browser."
    },
    async () => {
      const tabs = await browser.listTabs();
      return toolText(formatJson(tabs));
    }
  );

  server.registerTool(
    "switch_tab",
    {
      description: "Switch the active tab by zero-based tab index.",
      inputSchema: { index: z.number().int().min(0) }
    },
    async ({ index }) => {
      const tab = await browser.switchTab(index);
      return toolText(formatJson(tab));
    }
  );

  server.registerTool(
    "close_tab",
    {
      description: "Close a tab by index, or close the current active tab if no index is provided.",
      inputSchema: {
        index: z.number().int().min(0).optional()
      }
    },
    async ({ index }) => {
      const result = await browser.closeTab(index);
      return toolText(formatJson(result));
    }
  );

  server.registerTool(
    "open_tab",
    {
      description: "Open a new tab and optionally navigate it to a URL.",
      inputSchema: {
        url: z.string().url().optional()
      }
    },
    async ({ url }) => {
      const tab = await browser.openNewTab(url);
      return toolText(formatJson(tab));
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
