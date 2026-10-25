# Security Policy

## Supported Versions

InkBook maintains active security updates for the current release series:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x / 0.1.x | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Security Architecture & Threat Model

InkBook is an offline-first desktop application designed with strict security isolation:

1. **Strict Context Isolation**:
   - `contextIsolation: true` is unconditionally enforced.
   - `nodeIntegration: false` ensures renderer code cannot invoke native Node.js APIs directly.
   - All inter-process communication (IPC) uses strictly typed channels via the preload bridge (`contextBridge.exposeInMainWorld`).

2. **Content Security Policy (CSP)**:
   - A restrictive Content Security Policy is defined in HTML and reinforced on HTTP response headers in the main process.
   - Script execution is strictly confined to trusted local bundles (`'self'`). Inline script execution and unsafe evaluation (`'unsafe-eval'`) are disallowed.

3. **External Navigation Interception**:
   - In-app window navigation (`will-navigate`) and new window popups (`setWindowOpenHandler`) are blocked.
   - External hyperlinks must strictly match validated schemes (`http:`, `https:`, `mailto:`) and are delegated to the OS default browser via Electron's `shell.openExternal`.
   - Local file schemes, script execution protocols (`javascript:`), and arbitrary deep links are blocked.

4. **Production Hardening**:
   - Chromium Developer Tools (`devTools`) are disabled in production builds.
   - Keyboard shortcuts for dev tools (such as `F12` and `Ctrl+Shift+I`) are blocked in production.

---

## Reporting a Vulnerability

If you discover a security vulnerability in InkBook, please **do not open a public issue**. Instead, follow these disclosure steps:

1. Report the issue privately through [GitHub Private Vulnerability Reporting](https://github.com/sumitraj-saroj/InkBook/security/advisories/new).
2. Alternatively, contact the maintainers directly via email or security advisory channels.
3. Include detailed steps to reproduce the vulnerability, including sample notebooks or payloads if applicable.

We will acknowledge receipt within 48 hours and work with you on a resolution before any public disclosure.
