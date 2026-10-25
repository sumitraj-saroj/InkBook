function App(): React.JSX.Element {
  const handleTestApi = async (): Promise<void> => {
    const recent = await window.api.getRecentFiles()
    console.log('InkBook API connected. Recent files:', recent)
  }

  return (
    <div className="container">
      <h1>InkBook</h1>
      <button onClick={handleTestApi}>Test window.api</button>
    </div>
  )
}

export default App
