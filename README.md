# InkBook

A Linux desktop notebook application built on top of Excalidraw.

## Concept

- **Notebooks & Pages**: Create notebooks consisting of an ordered list of fixed-size pages (default A4 portrait: 794×1123 px at 96 dpi; A5 and landscape support planned).
- **Excalidraw Engine**: Full drawing capabilities (shapes, arrows, freehand, text, images, libraries, hand-drawn style, undo/redo).
- **Hard-Bounded Canvas**: Drawing area is strictly constrained to page boundaries—elements cannot be created, moved, or resized outside page bounds.
- **Custom Page Backgrounds**: Ruled, grid, dotted, or blank per page.
- **Single File Storage**: An entire notebook saves as a single `.inkbook` JSON file.
- **Standard Compatibility**: Page drawing data remains 100% compatible with standard `.excalidraw` format for effortless export and import.
- **Desktop UI**: Page navigation sidebar with reordering, addition, deletion, and dark/light theme support.

## Tech Stack

- **Framework**: Electron + electron-vite
- **UI & Language**: React + TypeScript (strict mode)
- **Drawing Engine**: `@excalidraw/excalidraw`
- **State Management**: Zustand
- **Testing**: Vitest
- **Packaging**: electron-builder (AppImage & pacman for Linux)
- **Code Quality**: ESLint + Prettier

## Project Structure

```
InkBook/
├── src/
│   ├── main/       # Electron main process (BrowserWindow, IPC handlers, app menu)
│   ├── preload/    # Secure preload bridge exposing typed window.api
│   ├── renderer/   # React application, UI layout, page sidebar, drawing canvas
│   └── shared/     # Shared TypeScript schemas, types, and constants
├── tests/          # Vitest unit test suite
├── resources/      # Application icons and packaging assets
└── electron-builder.yml
```

## Setup & Running

### Prerequisites

- Linux (Arch Linux rolling release recommended)
- Node.js (v20+ recommended) & npm

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Development

Run the development environment with hot-module reloading:

```bash
npm run dev
```

### Testing

Run unit tests via Vitest:

```bash
npm test
```

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

### Packaging (Linux)

Build production binaries (AppImage and pacman package):

```bash
npm run package
```

### Linux Display Servers (Wayland & X11)

InkBook is built with support for both modern Wayland compositors (Hyprland, Sway, GNOME, KDE Plasma) and traditional X11 window managers.

- **Automatic Detection**: InkBook sets `--ozone-platform-hint=auto` at runtime. Under Wayland sessions (`$WAYLAND_DISPLAY` or `XDG_SESSION_TYPE=wayland`), it runs natively as a Wayland client with fractional scaling support and client-side window decorations (`WaylandWindowDecorations`). Under X11, it automatically runs in X11 mode.
- **Manual Overrides**:
  - Force Wayland: `inkbook --ozone-platform=wayland`
  - Force X11 / XWayland: `inkbook --ozone-platform=x11`

### Arch Linux & AUR

A template `PKGBUILD` and step-by-step submission guide are provided in [`packaging/arch/`](file:///home/sumit/Code/InkBook/packaging/arch/).

## License & Third-Party Notices

See [NOTICE](file:///home/sumit/Code/InkBook/NOTICE) for third-party software notices and licensing information.
