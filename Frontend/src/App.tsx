import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { TailSpin } from 'react-loader-spinner'
import rehypeRaw from 'rehype-raw'

export default function App() {
  const [summary, setSummary] = useState<string>('')
  const [length, setLength] = useState<string>('short')
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [extractedText, setExtractedText] = useState<string>('')
  const [screenshot, setScreenshot] = useState<string | null>(null)

  const takeScreenshot = () => {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (screenshotUrl) => {
      if (screenshotUrl) {
        setScreenshot(screenshotUrl)
        // const link = document.createElement('a')
        // link.href = screenshotUrl
        // link.download = 'screenshot.png'
        // link.click()
      } else {
        console.error('Failed to capture screenshot.')
      }
    })
  }

  const getActiveTabUrl = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
          resolve(tabs[0].url)
        } else {
          reject(new Error('Unable to fetch the active tab URL.'))
        }
      })
    })
  }
  const handleScreenshot = async () => {
    try {
      setLoading(true)
      if (!screenshot) {
        console.error('No screenshot available.')
        return
      }
      const base64Image = screenshot.split(',')[1]
      const response = await fetch('http://localhost:5000/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      })
      const data = await response.json()
      console.log('Text extracted from the image:', data.text)
      if (data) {
        setExtractedText(data.text)
      } else {
        setExtractedText('no data available')
      }
    } catch (error) {
      console.error('Error sending screenshot:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    try {
      const activeTabUrl = await getActiveTabUrl()
      setUrl(activeTabUrl)
      setLoading(true)
      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: activeTabUrl, length }),
      })
      const data: { summary: string } = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching the summary:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="heading">SummarEase</h1>
      <div className="form">
        <label htmlFor="length" className="label">
          Select Summary Length:
        </label>
        <select id="length" value={length} onChange={(e) => setLength(e.target.value)} className="select">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
        <button onClick={handleSummarize} className="button">
          Summarize
        </button>
        <button onClick={takeScreenshot} className="button" style={{ marginLeft: '10px' }}>
          Capture Screenshot
        </button>
        <button onClick={handleScreenshot} className="button">
          Extract Text
        </button>
      </div>
      <div className="output">
        <p>
          <strong>URL:</strong> {url}
        </p>
        {loading ? (
          <div className="loader">
            <TailSpin height="50" width="50" color="#4fa94d" ariaLabel="loading" />
          </div>
        ) : (
          <p>
            <strong>Summary:</strong>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{summary}</ReactMarkdown>
          </p>
        )}
      </div>
      <div className="output">
        {extractedText && (
          <p>
            <strong>Extracted Text:</strong>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{extractedText}</ReactMarkdown>
          </p>
        )}
      </div>
      <div className="output">
        {screenshot && (
          <>
            <p>
              <strong>Captured Screenshot:</strong>
            </p>
            <img src={screenshot} alt="Captured Screenshot" style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
          </>
        )}
      </div>
    </div>
  )
}
