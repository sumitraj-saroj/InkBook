import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { useTheme } from '../context/ThemeContext'
import { useEditor } from '../context/EditorContext'

export function ExcalidrawEditor(): React.JSX.Element {
  const { theme } = useTheme()
  const { setExcalidrawAPI } = useEditor()

  return (
    <div
      className="editor-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Excalidraw
        theme={theme}
        excalidrawAPI={(api): void => {
          setExcalidrawAPI(api)
        }}
      />
    </div>
  )
}
