import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { useTheme } from '../context/ThemeContext'

export function ExcalidrawEditor(): React.JSX.Element {
  const { theme } = useTheme()

  return (
    <div
      className="editor-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Excalidraw theme={theme} />
    </div>
  )
}
