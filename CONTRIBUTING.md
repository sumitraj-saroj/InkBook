# Contributing to InkBook

Thank you for your interest in contributing to **InkBook**! We welcome contributions of all kinds, including bug fixes, feature enhancements, documentation improvements, and testing on various Linux distributions and desktop environments.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all contributors with respect and kindness.

---

## How to Contribute

### 1. Reporting Bugs
- Check the [existing issues](https://github.com/sumitraj-saroj/InkBook/issues) to avoid duplicate reports.
- If you find a new bug, submit an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml).
- Include details about your Linux distribution, window manager/compositor (Wayland vs. X11), package format (AppImage, pacman, source), and terminal logs if applicable.

### 2. Suggesting Enhancements
- Open a feature proposal using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml).
- Explain the motivation, user experience, and how it aligns with InkBook's core philosophy (hard-bounded pages, Excalidraw compatibility, offline-first reliability).

### 3. Submitting Code Changes

#### Prerequisites
- **Node.js**: v20 or newer (v22/v24/v26 supported)
- **npm**: v10+
- **Linux Environment**: Arch Linux, Ubuntu, Fedora, or any modern distribution (Wayland or X11)

#### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/sumitraj-saroj/InkBook.git
cd InkBook

# Install dependencies
npm install

# Start Electron in development mode with hot-reloading
npm run dev
```

#### Code Standards & Guidelines
- **TypeScript**: Strict mode is enforced (`strict: true`). Avoid `any` types; prefer strict schemas and discriminated unions.
- **Excalidraw Compatibility**: Page scene data must remain 100% compatible with standard `.excalidraw` elements. Never inject arbitrary properties directly onto Excalidraw elements.
- **Boundary Invariants**: Keep drawing elements constrained to page bounds `(0, 0, width, height)`.
- **Code Style**: Code is formatted with Prettier and linted with ESLint.

```bash
# Run unit tests
npm test

# Run strict type checking (both Node and Web processes)
npm run typecheck

# Run linter
npm run lint
```

#### Commit Message Guidelines
We follow the [Conventional Commits](https://www.conventionalcommits.org/) convention:

- `feat:` A new user-facing feature
- `fix:` A bug fix
- `docs:` Documentation updates
- `style:` Formatting or cosmetic changes
- `refactor:` Code restructuring without behavioral change
- `perf:` Performance optimizations
- `test:` Adding or updating tests
- `chore:` Build scripts, dependencies, CI/packaging changes

Example:
```bash
git commit -m "feat(background): add custom grid spacing option"
```

#### Pull Request Checklist
Before submitting a Pull Request:
1. Ensure all unit tests pass (`npm test`).
2. Ensure strict type checking passes (`npm run typecheck`).
3. Ensure ESLint reports zero errors and zero warnings (`npm run lint`).
4. Ensure the application packages cleanly (`npm run build`).
5. Open your PR against the `main` branch using the provided [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
