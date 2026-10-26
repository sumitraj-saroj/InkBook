# InkBook UI & Control Audit

This document records the comprehensive audit of all clickable controls, sidebar behaviors, native menus, and keyboard shortcuts in **InkBook**, performed during the viewport and control audit phase.

---

## Audit Table

| Category | Control / Trigger | Expected Behavior | Actual Behavior | Status | Suspected Cause |
|---|---|---|---|---|---|
| **Top Bar** | **Fit page button** | Scales and translates the canvas so the entire page is centered and completely visible within the usable area, without being obscured by the floating toolbar or touching the bottom bar. | The page's top edge is hidden under the floating Excalidraw toolbar (from y ≈ 96 to 108+ px) and the bottom touches/overlaps the footer navigation bar. Page is neither fully visible nor centered in the usable viewport. | **broken** | `calculatePageFit` computes zoom and scroll based on the full container height without subtracting the top floating toolbar inset (≈64–108px) and bottom footer bar inset (≈36–50px). There are also duplicate, uncoordinated fit implementations in `App.tsx` and `ExcalidrawEditor.tsx`. |
| **Top Bar** | **Notebook Title (Rename)** | Clicking allows inline editing; pressing Enter commits the new title; pressing Escape cancels. | Allows inline editing, commits on Enter and blur, reverts on Escape, and updates window title and dirty status. | **works** | Implemented cleanly in `NotebookTitle.tsx`. |
| **Top Bar** | **Welcome button** | Opens the Welcome screen with recent notebooks list and quick actions. | Opens Welcome modal cleanly, but pressing `Escape` does not dismiss it. | **partial** | `WelcomeScreen.tsx` lacks a window `keydown` listener for `Escape`. |
| **Top Bar** | **New button** | Prompts to discard if dirty, then creates a new blank notebook with "Page 1". | Prompts if dirty, initializes new notebook. | **works** | Handled correctly via `handleNewNotebook`. |
| **Top Bar** | **Open button** | Opens native file dialog with `.inkbook` filter and loads selected notebook. | Native dialog opens and notebook loads correctly. | **works** | Handled correctly via `handleOpenNotebook`. |
| **Top Bar** | **Save button** | Saves current notebook to disk; displays dirty indicator bullet `•` when modified. | Saves notebook atomically, updates window title, clears dirty bullet. | **works** | Handled correctly via `handleSaveNotebook`. |
| **Top Bar** | **Background dropdown** | Dropdown allows switching the current page's background pattern (`ruled`, `grid`, `dots`, `blank`). | Updates active page background in store; renders immediately behind canvas without scene corruption. | **works** | Handled cleanly in `BackgroundPicker.tsx`. |
| **Top Bar** | **Open .excalidraw button** | Imports an external `.excalidraw` file into the active workspace. | Directly loads elements and calls `scrollToContent` without page bounds enforcement or uniform scaling, bypassing Phase 7 scale-to-fit logic. | **partial** | Leftover prototype handler in `App.tsx` (`handleOpen`) does not use `importExcalidrawIntoCurrentPage`. |
| **Top Bar** | **Save .excalidraw button** | Serializes active scene to standard `.excalidraw` JSON and prompts to save. | Serializes elements and writes clean `.excalidraw` file. | **works** | Handled correctly via `handleSave`. |
| **Top Bar** | **Export button** | Opens the Export dialog with format options (PNG, SVG, Excalidraw, PDF). | Opens dialog, but pressing `Escape` does not close it. | **partial** | `ExportDialog.tsx` lacks a window `keydown` listener for `Escape`. |
| **Top Bar** | **Search button** | Opens the global search dialog across page titles and canvas text. | Opens search modal, highlights queries, allows keyboard navigation to matches. | **works** | Handled correctly via `SearchDialog.tsx`. |
| **Top Bar** | **Theme button** | Cycles between System, Dark, and Light theme preferences and persists choice. | Cycles theme preference and applies corresponding CSS attributes and Excalidraw theme. | **works** | Handled cleanly via `useTheme` / `ThemeContext`. |
| **Sidebar** | **View mode: List** | Toggles sidebar to single-column list view with small thumbnail previews. | Sets view mode to `list`, adjusts layout and persists preference in settings. | **works** | Handled in `Sidebar.tsx`. |
| **Sidebar** | **View mode: Grid/Thumbnail** | Toggles sidebar to multi-column card view with larger thumbnail previews. | Sets view mode to `thumbnail`, renders card grid and persists preference. | **works** | Handled in `Sidebar.tsx`. |
| **Sidebar** | **Page selection (Click)** | Switches active page, saves previous page scene, and restores target page. | Switches page; however, switching invokes initial fit which inherits the broken unpadded viewport positioning. | **partial** | Page data transitions correctly, but fit viewport inherits the toolbar collision bug. |
| **Sidebar** | **Page inline rename** | Double-clicking title enables inline input; Enter commits, Esc cancels. | Focuses input, auto-selects text, commits on Enter/blur, cancels on Escape. | **works** | Handled in `Sidebar.tsx`. |
| **Sidebar** | **Add page button (`+ Add page`)** | Appends a new page with a clear, non-conflicting title (e.g. next free number). | Generates title using `pages.length + 1`. If pages were previously deleted, this generates duplicate or confusing titles (e.g. "Page 2" when Page 2 already exists or when remaining page is "Page 3"). | **partial** | `notebookStore.ts` `addPage` calculates `pages.length + 1` instead of finding the next free sequential number. |
| **Sidebar** | **Page title numbering** | Displays clear page numbering alongside custom page titles. | Prefix displays index (`{index + 1}.`), which causes confusing displays like `1. Page 3` when pages were deleted in a 1-page notebook. | **partial** | Page index prefix clashes with default leftover title names when pages are deleted or reordered. |
| **Sidebar** | **Drag & Drop reordering** | Dragging a page item before/after another page reorders the notebook pages. | Reorders pages smoothly in array and updates active page index without data loss. | **works** | HTML5 drag and drop events handled in `Sidebar.tsx`. |
| **Sidebar** | **Thumbnails** | Generates rendered visual previews of page content with debounced caching. | Generates crisp thumbnails, caches by content version, and updates on modification. | **works** | Handled in `PageThumbnail.tsx`. |
| **Sidebar** | **Keyboard navigation** | Arrow Up/Down moves focus, Enter/Space selects, Home/End jumps, Delete deletes. | Allows full keyboard navigation through the page list without mouse interaction. | **works** | Keydown handler in `Sidebar.tsx`. |
| **Page Context Menu** | **Kebab button (`...`)** | Opens context menu positioned relative to the clicked page item. | Opens menu cleanly with backdrop dismissal on click outside or Escape. | **works** | Handled in `PageContextMenu.tsx`. |
| **Page Context Menu** | **Rename option** | Triggers inline rename mode on the target page. | Focuses input immediately and selects text. | **works** | Dispatches to `handleStartRename`. |
| **Page Context Menu** | **Duplicate option** | Clones target page and inserts copy immediately after it with "(Copy)" suffix. | Duplicates elements, files, backgrounds, and settings cleanly. | **works** | Handled via `duplicatePage` in store. |
| **Page Context Menu** | **Page Settings... option** | Opens Page Settings dialog for the target page. | Opens modal with dimensions, orientation, background, and margin toggles. | **works** | Handled in `PageSettingsDialog.tsx`. |
| **Page Context Menu** | **Move up option** | Moves page up one position (disabled on first page). | Disabled on first page; moves page up and maintains focus. | **works** | Handled via `reorderPages`. |
| **Page Context Menu** | **Move down option** | Moves page down one position (disabled on last page). | Disabled on last page; moves page down and maintains focus. | **works** | Handled via `reorderPages`. |
| **Page Context Menu** | **Delete option** | Deletes page with confirmation prompt (disabled if only 1 page remains). | Disabled when `pages.length === 1`; deletes page and selects adjacent page when confirmed. | **works** | Handled via `deletePage`. |
| **Bottom Bar** | **Previous page (`<`)** | Navigates to previous page; disabled on first page. | Disabled on page 1; navigates backwards cleanly. | **works** | Handled in `PageFooter.tsx`. |
| **Bottom Bar** | **Page indicator (`Page X / Y`)**| Shows 1-based index of current page and total page count. | Accurately updates on page add, delete, reorder, and switch. | **works** | Rendered in `PageFooter.tsx`. |
| **Bottom Bar** | **Next page (`>`)** | Navigates to next page; disabled on last page. | Disabled on last page; navigates forward cleanly. | **works** | Handled in `PageFooter.tsx`. |
| **Bottom Bar** | **Add page (`+`)** | Quick button to add a new page. | Adds new page; shares the same numbering flaw as sidebar add button. | **partial** | Uses `addPage` with `pages.length + 1`. |
| **Bottom Bar** | **Preset pill button** | Displays current size/orientation (`A4 Port.`) and opens Page Settings. | Shows label and opens settings dialog cleanly on click. | **works** | Handled in `PageFooter.tsx`. |
| **Bottom Bar** | **Footer Fit button** | Fits active page into viewport. | Shares the same viewport collision bug as Topbar Fit button: top is hidden under toolbar, bottom touches footer. | **broken** | Calls `handleFitToWindow` which ignores top and bottom UI insets. |
| **Dialogs** | **WelcomeScreen** | Offers New, Open, Recents list, Clear Recents, Continue. | All actions work, but pressing `Escape` does not close the dialog. | **partial** | Missing window `keydown` listener for `Escape`. |
| **Dialogs** | **ExportDialog** | Export format tabs, scale selector, background toggles, PDF progress bar. | Exports generate cleanly, but `Escape` does not dismiss modal. | **partial** | Missing window `keydown` listener for `Escape`. |
| **Dialogs** | **CommandPalette** | Fuzzy action search, keyboard arrows, Enter to execute, Escape to close. | Searches actions, executes commands, dismisses on Escape or click outside. | **works** | Handled in `CommandPalette.tsx`. |
| **Dialogs** | **SearchDialog** | Search query input, snippet highlights, arrow navigation, jump to match. | Searches titles and text; Escape only works when input is focused, not when focus moves to list. | **partial** | `Escape` key handler is on `<input>` rather than window/dialog level. |
| **Dialogs** | **PageSettingsDialog** | Size presets, custom width/height, orientation, background, resize overflow prompt. | Updates dimensions, offers scale-to-fit vs clamp on shrink, commits cleanly. | **works** | Handled in `PageSettingsDialog.tsx`. |
| **Dialogs** | **ShortcutsHelpDialog** | Lists all shortcuts grouped by category; Got it button. | Renders shortcuts table; click outside closes, but `Escape` does not dismiss. | **partial** | Missing window `keydown` listener for `Escape`. |
| **Native Menu** | **File > New Notebook (Ctrl+N)** | Creates new notebook. | Dispatches `new-notebook` action; warns if dirty. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **File > Open Notebook... (Ctrl+O)** | Shows open dialog. | Dispatches `open-notebook` action. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **File > Open Recent** | Shows list of recent files. | Lists recent files; clicking opens target notebook. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **File > Save Notebook (Ctrl+S)** | Saves current notebook. | Saves file atomically. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **File > Save As... (Ctrl+Shift+S)** | Prompts for new save path. | Saves notebook under new path. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **File > Close Notebook (Ctrl+W)** | Closes current notebook. | Calls `handleNewNotebook()` creating a blank notebook instead of closing window or showing Welcome screen. | **partial** | Misaligned action mapping in `App.tsx`. |
| **Native Menu** | **File > Import / Export items** | Dispatches respective import and export workflows. | All 7 import/export menu actions dispatch and open correct dialogs. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **Edit > Undo / Redo / Cut / Copy / Paste** | Standard edit clipboard and undo operations. | Delegated to active focused webContents elements. | **works** | Standard Electron menu roles. |
| **Native Menu** | **Edit > Find in Notebook... (Ctrl+F)** | Opens search dialog. | Opens search modal cleanly. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **View > Command Palette... (Ctrl+K)** | Opens command palette. | Opens command palette cleanly. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **View > Zoom In / Out / Reset Zoom** | Expected to zoom Excalidraw canvas. | Zooms the entire Chromium application window (UI elements, text, buttons) rather than Excalidraw canvas. | **broken** | Uses Chromium `role: 'zoomIn'`, `role: 'zoomOut'`, `role: 'resetZoom'` instead of custom IPC actions for Excalidraw canvas zoom. |
| **Native Menu** | **Help > Keyboard Shortcuts (F1)** | Opens shortcuts dialog. | Opens shortcuts modal cleanly. | **works** | Mapped in `menu.ts` and `App.tsx`. |
| **Native Menu** | **Help > Documentation / About** | Opens documentation and about info. | Click handlers are empty placeholders (`// Placeholder`). | **partial** | Empty callback in `menu.ts`. |
| **Shortcuts** | **Ctrl+0** | Fit page to window. | Shares the same viewport collision bug as Fit buttons: page top is hidden under toolbar, bottom touches footer. | **broken** | Calls `handleFitToWindow` which ignores top and bottom UI insets. |
| **Shortcuts** | **Ctrl+N** | New notebook. | Prompts if dirty, resets notebook. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+Shift+N** | Create new page. | Adds new page; inherits page numbering flaw. | **partial** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+O** | Open notebook. | Opens file picker. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+S** | Save notebook. | Saves notebook. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+Shift+S** | Save notebook as. | Prompts for new save path. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+PageDown** | Next page. | Advances to next page. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+PageUp** | Previous page. | Moves to previous page. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **F2** | Rename current page. | Activates inline rename input in sidebar. | **works** | Dispatches `inkbook:rename-current-page`. |
| **Shortcuts** | **F1** | Shortcuts help dialog. | Opens shortcuts modal. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+K** | Command palette. | Toggles command palette. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Ctrl+F** | Global search. | Toggles search dialog. | **works** | Handled in `App.tsx`. |
| **Shortcuts** | **Escape** | Dismiss active modal or overlay. | Closes Command Palette and Search (if input focused); fails to close Welcome, Shortcuts, and Export modals. | **partial** | Lack of centralized or dialog-level Escape listeners in several modal components. |

---

## Summary of Audit Findings

### Critical Issues (Broken):
1. **Fit Page (`Fit page` button, Footer `Fit` button, `Ctrl+0`, Initial page load, Page switch)**:
   - **Root Cause**: `calculatePageFit` computes zoom and translation based on the raw container height without subtracting the floating Excalidraw toolbar height at the top and the footer bar height at the bottom. At default viewport sizes, the page top starts at `y ≈ 96px`, placing it directly beneath the toolbar (`bottom ≈ 108px`). The page is neither centered nor fully visible.
   - **Architectural Duplication**: `handleFitToWindow` in `App.tsx` and `fitPageToViewport` in `ExcalidrawEditor.tsx` duplicate calculation logic and have divergent fallback dimensions.

2. **Native Menu Zoom (`View > Zoom In / Out / Reset Zoom`)**:
   - Uses Electron window zoom roles (`zoomIn`, `zoomOut`, `resetZoom`) which scales the entire webContents window and UI instead of controlling the Excalidraw canvas zoom level.

### High/Medium Issues (Partial):
3. **Page Title Numbering**:
   - `addPage` computes `pages.length + 1`. In a notebook where pages have been deleted (e.g. Page 1 deleted, leaving Page 2 or Page 3), adding a page produces duplicate names or strange sequencing (e.g., `1. Page 3` followed by `2. Page 2`). New pages must always receive the next free sequential number, and an initial notebook's first page must be titled "Page 1".
4. **Escape Key Handling on Modals**:
   - `WelcomeScreen`, `ExportDialog`, and `ShortcutsHelpDialog` do not listen for the `Escape` key at the window level, trapping keyboard-only users until they click a close button.
5. **Topbar "Open .excalidraw" Prototype Handler**:
   - Topbar button `handleOpen` calls raw `scrollToContent` without page bounds clamping or scale-to-fit, whereas the File menu and utility `importExcalidrawIntoCurrentPage` correctly handle scaling.
6. **Native Menu "Close Notebook" (Ctrl+W)**:
   - Dispatches `close-notebook`, which simply calls `newNotebook()` instead of closing the notebook or returning to the Welcome screen.
7. **Native Menu Help Placeholders**:
   - `Documentation` and `About InkBook` have empty placeholder click callbacks.
