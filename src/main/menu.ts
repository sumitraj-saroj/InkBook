import { app, Menu, MenuItemConstructorOptions } from 'electron'

export function setupApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: '&File',
      submenu: [
        {
          label: 'New Notebook',
          accelerator: 'CmdOrCtrl+N',
          click: (): void => {
            // Placeholder for Phase 2/3: New Notebook action
          }
        },
        {
          label: 'Open Notebook...',
          accelerator: 'CmdOrCtrl+O',
          click: (): void => {
            // Placeholder for Phase 3: Open Notebook action
          }
        },
        {
          label: 'Save Notebook',
          accelerator: 'CmdOrCtrl+S',
          click: (): void => {
            // Placeholder for Phase 3: Save Notebook action
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: (): void => {
            // Placeholder for Phase 3: Save As Notebook action
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    {
      label: '&View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: '&Help',
      submenu: [
        {
          label: 'Documentation',
          click: (): void => {
            // Placeholder for documentation
          }
        },
        {
          label: 'About InkBook',
          click: (): void => {
            // Placeholder for about dialog
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
