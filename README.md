# InkBook

A Linux desktop notebook application built on top of Excalidraw.

## Concept

- **Notebooks & Pages**: Create notebooks consisting of an ordered list of fixed-size pages (default A4 portrait: 794x1123 px at 96 dpi; A5 and landscape support planned).
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
- **Packaging**: electron-builder (AppImage & .deb for Linux)
- **Code Quality**: ESLint + Prettier

## License & Third-Party Notices

See [NOTICE](file:///home/sumit/Code/InkBook/NOTICE) for third-party software notices and licensing information.
