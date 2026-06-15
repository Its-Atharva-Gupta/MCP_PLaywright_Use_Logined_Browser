# AGENTS.md

## Goal

Create a Playwright-based MCP server that allows AI agents to control a persistent Chromium browser profile on a Raspberry Pi.

The browser profile must retain:

* Login sessions
* Cookies
* Local storage
* IndexedDB
* Existing authenticated state

This is intended for personal AI automation (LinkedIn, GitHub, dashboards, SaaS tools, etc.).

Do NOT use Chrome DevTools autoConnect.

Do NOT require a desktop environment after initial setup.

Do NOT require a visible browser window.

---

## Requirements

### Browser

Use Chromium.

Create a dedicated browser profile:

~/.playwright-agent-profile

The agent must always reuse this profile.

Never launch a temporary profile.

Never delete profile data.

---

## MCP

Implement as a standard MCP server.

The server must expose tools such as:

* navigate(url)
* click(selector)
* fill(selector, value)
* screenshot()
* extract_text()
* execute_javascript()
* list_tabs()
* switch_tab()
* close_tab()

Use Playwright internally.

---

## Installation

The entire system must be runnable using:

npx

Avoid global installs whenever possible.

A user should be able to run:

npx <package-name>

to start the MCP server.

Use package.json bin configuration.

---

## First Run Experience

Provide a command:

npx <package-name> login

This command should:

1. Launch Chromium
2. Use ~/.playwright-agent-profile
3. Allow the user to manually log into websites
4. Persist all browser state
5. Exit cleanly

After login is complete, future agent sessions should reuse those credentials automatically.

---

## Runtime Mode

Provide:

npx <package-name> serve

This should:

1. Launch Chromium headless
2. Reuse ~/.playwright-agent-profile
3. Start the MCP server
4. Expose all browser tools

The user should not need to log in again.

---

## Stability Requirements

* Must survive Pi reboots
* Must survive agent restarts
* Must preserve cookies
* Must preserve sessions
* Must preserve local storage

---

## Platform

Primary target:

* Raspberry Pi OS
* Debian Linux
* ARM64

---

## Dependencies

Prefer:

* Node.js
* TypeScript
* Playwright
* Official MCP SDK

Avoid:

* Puppeteer
* Selenium
* Xvfb unless absolutely necessary

---

## Deliverables

Generate:

* package.json
* source code
* README.md
* setup instructions
* MCP configuration examples

The final result should allow:

1. User logs into Chromium once.
2. Browser state is saved.
3. AI agents connect through MCP.
4. Future sessions automatically reuse all credentials.

The setup should require minimal maintenance and be suitable for long-running personal automation on a Raspberry Pi.
