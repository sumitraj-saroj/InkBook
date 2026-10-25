# Changelog

All notable changes to **InkBook** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-26

### Added

#### Core & Architecture (Phases 1 & 2)
- Electron 34 desktop shell powered by React 19, TypeScript strict mode, and electron-vite.
- Embedded `@excalidraw/excalidraw` canvas with full hand-drawn vector graphics, shapes, arrows, text, and asset library support.
- Fully typed IPC bridge via secure `contextBridge` (`window.api`).
- Zustand-powered centralized reactive state management.

#### Canvas Boundaries & Multi-Page Engine (Phases 3 & 4)
- Hard boundary constraint engine: draws are strictly bounded to physical page dimensions (`0, 0, width, height`).
- Mathematical clamping and prevention logic for shapes, arrows, freehand lines, text, and pasted elements.
- Multi-page document model: add, delete, duplicate, and reorder pages seamlessly.
- Page presets: A4 Portrait (794×1123 px), A4 Landscape (1123×794 px), A5 Portrait (559×794 px), and custom dimensions.

#### Paper Backgrounds (Phase 5)
- Per-page customizable paper background rendering layer positioned behind the transparent canvas:
  - **Ruled**: Horizontal lines (32 px spacing, 96 px top margin) with toggleable left margin line.
  - **Grid**: Square grid (32 px spacing).
  - **Dots**: Subtle dot grid (32 px spacing).
  - **Blank**: Plain paper texture.
- Perfect synchronization with Excalidraw pan (`scrollX`, `scrollY`) and zoom (`zoom.value`) without jitter or lag.
- Clean separation: Background configurations live in document page metadata, keeping `.excalidraw` element scenes pure.

#### Atomic Persistence & Recovery (Phase 6)
- File service with atomic file operations: temp file write -> fsync -> atomic rename.
- Automatic rolling backup (`.inkbook.bak`) preserving the previous save.
- Debounced autosave (2 seconds after the last change).
- Automatic crash recovery snapshots (saved every 30 seconds for unsaved notebooks) with restore prompt on startup.
- Dirty state indicator in window title (`• Document`) and unsaved change confirmation on exit.
- Recent notebooks menu and welcome screen tracking the last 10 documents.
- Linux single-instance lock and CLI file opening (`inkbook /path/to/file.inkbook`).

#### Export & Import Capabilities (Phase 7)
- Multi-page vector PDF generation (`pdf-lib`) assembling all notebook pages with page sizes and backgrounds preserved.
- High-resolution PNG export (1x, 2x, 3x scale) with optional background inclusion or transparency.
- Vector SVG export.
- Pure `.excalidraw` export compatible with [excalidraw.com](https://excalidraw.com).
- Smart `.excalidraw` import with scale-to-fit logic for oversized scenes.
- Library import for `.excalidrawlib` files.
- Real-time debounced sidebar thumbnail caching with list/thumbnail view toggle.

#### Usability Polish & Accessibility (Phase 8)
- Command Palette (`Ctrl+K`) for fast keyboard-driven actions.
- Keyboard navigation shortcuts (`Ctrl+PageUp`, `Ctrl+PageDown`, `Ctrl+Shift+N`, `F2`).
- Page settings dialog with content scaling and clamping options when resizing pages.
- Global full-text search across page titles and canvas text elements.
- Adaptive theming: Light and Dark modes with automatic system preference tracking and persistence.
- Page navigation footer (`Page X / Y`).
- Fully accessible keyboard navigation in sidebar and dialogs.

#### Linux Packaging & Hardening (Phase 9)
- Packaged targets for Linux: **AppImage** and native **pacman** package (`.pacman`).
- Complete application icon set in all standard sizes (16px to 512px) and SVG source.
- Standard `.desktop` entry and shared MIME database XML (`application/x-inkbook`).
- Native Wayland (`--ozone-platform-hint=auto`) and X11 compatibility.
- Production hardening: Disabled DevTools in production builds, strict Content Security Policy, and external link validation.
- Arch Linux PKGBUILD template and AUR submission instructions.
- Automated GitHub Actions build and release workflow.
