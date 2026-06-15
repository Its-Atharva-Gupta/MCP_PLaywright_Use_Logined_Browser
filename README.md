# playwright-persistent-mcp

`playwright-persistent-mcp` is a standard MCP server that drives a persistent Chromium profile with Playwright. It is designed for Raspberry Pi OS / Debian ARM64 setups where you want to reuse existing Chromium cookies, local storage, IndexedDB, and authenticated sessions later in headless mode.

By default, the server now uses your existing Chromium user data directory:

`~/.config/chromium`

You can override that with `PLAYWRIGHT_AGENT_PROFILE_DIR`.

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

The implementation uses Playwright's `chromium.launchPersistentContext()` with a fixed Chromium user data directory. That means Playwright reuses the same on-disk browser profile every time:

- cookies stay on disk
- local storage stays on disk
- IndexedDB stays on disk
- existing sessions stay on disk

No temporary profile is created, and the configured user data directory is never deleted by the server.

Important:

- close normal Chromium before starting Playwright against the same user data directory
- do not run regular Chromium and this MCP server against the same profile at the same time

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

4. Make sure regular Chromium is fully closed if you want to reuse your existing browser cookies.

5. Start the server through `npx`.

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

For login compatibility, the launcher also suppresses Playwright's default `--enable-automation` flag. Some sites, especially Google sign-in, are more likely to reject a browser session when that flag is present.

If your environment needs sandboxing disabled, set:

```bash
export PLAYWRIGHT_AGENT_NO_SANDBOX=1
```

## Using Your Existing Chromium Cookies

If your existing cookies already live in the default Raspberry Pi Chromium profile, you usually do not need a separate login step at all. Just make sure Chromium is closed, then run:

```bash
npx playwright-persistent-mcp serve
```

If your cookies are in a different Chromium user data directory, point the server at it:

```bash
export PLAYWRIGHT_AGENT_PROFILE_DIR="/path/to/chromium-user-data-dir"
npx playwright-persistent-mcp serve
```

## Manual Login

Run:

```bash
npx playwright-persistent-mcp login
```

This will:

1. launch Chromium in headed mode
2. reuse `~/.config/chromium` by default
3. let you manually log into sites
4. persist all browser state to disk
5. finish when you close the browser

After that, the same Chromium user data directory can be reused headlessly.

## Runtime Mode

Run:

```bash
npx playwright-persistent-mcp serve
```

This will:

1. launch headless Chromium
2. reuse `~/.config/chromium` by default
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

- `PLAYWRIGHT_AGENT_PROFILE_DIR`: override the Chromium user data directory
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`: force a specific Chromium binary
- `PLAYWRIGHT_AGENT_NO_SANDBOX=1`: add `--no-sandbox` and `--disable-setuid-sandbox`

## Development

Build the TypeScript source:

```bash
npm run build
```

## Operational Tips

- Close normal Chromium before running `serve` if both point at the same profile.
- Run `login` only if you need to refresh a site session.
- Keep the Chromium user data directory backed up if the sessions are important.
- Use a system service like `systemd` if you want `serve` to start automatically on boot.
