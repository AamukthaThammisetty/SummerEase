import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { TailSpin } from 'react-loader-spinner'
import rehypeRaw from 'rehype-raw'

export default function App() {
  const [summary, setSummary] = useState<string>('')
  const [length, setLength] = useState<string>('short')
  const [url, setUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
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

  const handleSummarize = async () => {
    try {
      const activeTabUrl = await getActiveTabUrl()
      setUrl(activeTabUrl)
      setLoading(true)
      const response = await fetch('http://localhost:5000/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeTabUrl,
          length,
        }),
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
    </div>
  )
}
