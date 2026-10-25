import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'

export function ExcalidrawEditor(): React.JSX.Element {
  return (
    <div
      className="editor-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Excalidraw />
    </div>
  )
}
