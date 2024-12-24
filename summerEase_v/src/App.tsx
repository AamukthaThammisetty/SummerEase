import { useState } from 'react'

export default function App() {
  const [summary, setSummary] = useState<string>('')
  const [length, setLength] = useState<string>('short')
  const [url, setUrl] = useState<string>('')

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
    }
  }

  return (
    <div>
      <h1>Website Summarizer</h1>
      <select value={length} onChange={(e) => setLength(e.target.value)}>
        <option value="short">Short</option>
        <option value="medium">Medium</option>
      </select>
      <button onClick={handleSummarize}>Summarize</button>
      <p>URL: {url}</p>
      <p>Summary: {summary}</p>
    </div>
  )
}
