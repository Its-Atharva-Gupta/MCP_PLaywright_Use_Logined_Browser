# playwright-persistent-mcp

`playwright-persistent-mcp` is a standard MCP server that drives a persistent Chromium profile with Playwright. It is designed for Raspberry Pi OS / Debian ARM64 setups where you want to log into websites once and let AI agents reuse the same cookies, local storage, IndexedDB, and authenticated sessions later in headless mode.

The server always uses:

`~/.playwright-agent-profile`

unless you override it with `PLAYWRIGHT_AGENT_PROFILE_DIR`.

## What It Provides

The MCP server exposes these tools:

- `navigate(url)`
- `click(selector)`
- `fill(selector, value)`
- `screenshot(outputPath?, fullPage?)`
- `extract_text(selector?)`
- `execute_javascript(script)`
- `list_tabs()`
- `switch_tab(index)`
- `close_tab(index?)`
- `open_tab(url?)`

## Why This Works For Persistent Login

The implementation uses Playwright's `chromium.launchPersistentContext()` with a fixed profile directory. That means Chromium reuses the same on-disk browser profile every time:

- cookies stay on disk
- local storage stays on disk
- IndexedDB stays on disk
- existing sessions stay on disk

No temporary profile is created, and the profile is never deleted by the server.

## Installation

1. Install system Chromium on the Pi.

```bash
sudo apt update
sudo apt install -y chromium
```

2. Install Node.js 20+.

3. Install the package dependencies and build it.

```bash
npm install
```

4. Start the server through `npx`.

```bash
npx playwright-persistent-mcp serve
```

## Raspberry Pi Notes

The server prefers a system Chromium binary, in this order:

1. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
2. `/usr/bin/chromium`
3. `/usr/bin/chromium-browser`
4. `/snap/bin/chromium`

This is intentional because Raspberry Pi ARM64 environments are usually more reliable with the distro Chromium package than with assumptions about bundled browser binaries.

The runtime also passes a few Chromium flags that are typically helpful on Pi and Debian systems:

- `--disable-dev-shm-usage`
- `--disable-gpu`
- `--no-first-run`
- `--no-default-browser-check`
- `--password-store=basic`

If your environment needs sandboxing disabled, set:

```bash
export PLAYWRIGHT_AGENT_NO_SANDBOX=1
```

## First Run: Manual Login

Run:

```bash
npx playwright-persistent-mcp login
```

This will:

1. launch Chromium in headed mode
2. reuse `~/.playwright-agent-profile`
3. let you manually log into sites
4. persist all browser state to disk
5. finish when you close the browser

After that, the profile can be reused headlessly.

## Runtime Mode

Run:

```bash
npx playwright-persistent-mcp serve
```

This will:

1. launch headless Chromium
2. reuse `~/.playwright-agent-profile`
3. start the MCP server on stdio
4. expose browser tools to your MCP client

## MCP Client Configuration Examples

### Claude Desktop

```json
{
  "mcpServers": {
    "playwright-persistent": {
      "command": "npx",
      "args": [
        "playwright-persistent-mcp",
        "serve"
      ]
    }
  }
}
```

### Codex / Generic MCP Client

```json
{
  "command": "npx",
  "args": [
    "playwright-persistent-mcp",
    "serve"
  ]
}
```

### Local Development

If you are running from the cloned project before publishing to npm:

```json
{
  "command": "node",
  "args": [
    "/absolute/path/to/project/dist/cli.js",
    "serve"
  ]
}
```

## Environment Variables

- `PLAYWRIGHT_AGENT_PROFILE_DIR`: override the persistent profile path
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: force a specific Chromium binary
- `PLAYWRIGHT_AGENT_NO_SANDBOX=1`: add `--no-sandbox` and `--disable-setuid-sandbox`

## Development

Build the TypeScript source:

```bash
npm run build
```

## Operational Tips

- Run `login` once after a reboot only if a site logged you out.
- Keep the profile directory backed up if the sessions are important.
- Use a system service like `systemd` if you want `serve` to start automatically on boot.
