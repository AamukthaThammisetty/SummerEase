import { useState } from 'react'
import { Button } from './button'

const Dummy = () => {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  const handleScreenshot = async () => {
    try {
      // Ensure the Chrome extension environment is available
      if (!chrome || !chrome.tabs || !chrome.tabs.captureVisibleTab) {
        console.error('Chrome extension API not available.')
        return
      }

      // Capture the visible tab directly
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Error capturing screenshot:', chrome.runtime.lastError.message)
        } else {
          setScreenshotUrl(dataUrl)
        }
      })
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dummy Component</h1>
      <Button onClick={handleScreenshot}>Take Full Tab Screenshot</Button>

      {screenshotUrl && (
        <div style={{ marginTop: '20px' }}>
          <h2>Screenshot Preview:</h2>
          <img src={screenshotUrl} alt="Screenshot Preview" style={{ maxWidth: '100%', border: '2px solid #000' }} />
        </div>
      )}
    </div>
  )
}

export default Dummy
