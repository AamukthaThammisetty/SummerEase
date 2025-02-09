import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import axios from 'axios'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Loader2, FileText, Camera, FileSearch } from 'lucide-react'

export default function App() {
  const [summary, setSummary] = useState('')
  const [length, setLength] = useState('short')
  const [question, setQuestion] = useState('')
  const [url, setUrl] = useState('')
  // const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  // const [screenshot, setScreenshot] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  type Message = {
    role: string
    content: string
  }
  const handleScreenshot = async () => {
    try {
      if (!chrome || !chrome.tabs || !chrome.tabs.captureVisibleTab) {
        console.error('Chrome extension API not available.')
        return
      }
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

  // const takeScreenshot = () => {
  //   chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
  //     if (response.screenshotUrl) {
  //       setScreenshot(response.screenshotUrl)
  //       setActiveTab('screenshot')
  //     }
  //   })
  // }

  const getActiveTabUrl = async () => {
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

  const generateAnswer = async () => {
    try {
      setLoading(true)

      // Send only the latest question (not the entire message history)
      const updatedMessages: Message[] = [{ role: 'user', content: question }]
      setMessages((prevMessages) => [...prevMessages, ...updatedMessages])

      // Send the latest message (just the question) to the API
      const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDY3HG8xMfPLcOSgIpiEzE029G1Govzi-4', {
        contents: updatedMessages.map((msg) => ({ parts: [{ text: msg.content }] })),
      })

      const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (textResponse) {
        // Add the assistant's response to the messages array
        setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: textResponse }])
      }

      setQuestion('') // Clear the question input after sending
    } catch (error) {
      console.error('Error generating answer:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  // const generateAnswer = async () => {
  //   try {
  //     setLoading(true)
  //     const response = await axios({
  //       url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDY3HG8xMfPLcOSgIpiEzE029G1Govzi-4',
  //       method: 'post',
  //       data: {
  //         contents: [{ parts: [{ text: question }] }],
  //       },
  //     })

  //     // Corrected the response structure
  //     const textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text
  //     setAnswer(textResponse)
  //     if (textResponse) {
  //       console.log(textResponse)
  //     } else {
  //       console.error('No valid text received from the response.')
  //     }
  //   } catch (error) {
  //     console.error('Error generating answer:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handletext = async () => {
    if (!screenshotUrl) {
      console.error('No screenshot available. Please capture a screenshot first.')
      return
    }
    try {
      setLoading(true)
      // Extracting the base64 portion from the screenshot URL
      const base64Image = screenshotUrl.split(',')[1]
      // Sending the base64 image to the backend
      const response = await axios.post('http://localhost:8080/screenshot', {
        image: base64Image,
      })
      const data = response.data
      if (data && data.text) {
        setExtractedText(data.text)
        setActiveTab('extracted')
      } else {
        setExtractedText('No text extracted from the image.')
      }
    } catch (error) {
      console.error('Error sending screenshot for text extraction:', error)
      setExtractedText('Error extracting text. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSummarize = async () => {
    try {
      const activeTabUrl = await getActiveTabUrl()

      // @ts-ignore
      setUrl(activeTabUrl)
      setLoading(true)
      const response = await axios.post('http://localhost:8080/summarize', {
        url: activeTabUrl,
        length,
      })
      const data = await response.data
      setSummary(data.summary)
      setActiveTab('summary')
    } catch (error) {
      console.error('Error fetching the summary:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-lg font-semibold">SummarEase</h1>
        <Select value={length} onValueChange={setLength}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Length" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">Short</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-1 p-2 bg-white border-b">
        <Button onClick={handleSummarize} disabled={loading} className="flex-1 h-8 text-xs">
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
          Summarize
        </Button>
        <Button onClick={handleScreenshot} variant="outline" className="flex-1 h-8 text-xs">
          <Camera className="w-3 h-3 mr-1" />
          Screenshot
        </Button>
        <Button onClick={handletext} disabled={!screenshotUrl || loading} className="flex-1 h-8 text-xs">
          <FileSearch className="w-3 h-3 mr-1" />
          Extract
        </Button>
      </div>

      {url && <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b truncate">{url}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="px-2 h-9 bg-gray-50 border-b">
          <TabsTrigger value="summary" className="text-xs">
            Summary
          </TabsTrigger>
          <TabsTrigger value="extracted" className="text-xs">
            Extracted Text
          </TabsTrigger>
          <TabsTrigger value="screenshot" className="text-xs">
            Screenshot
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="text-xs">
            chatbot
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="summary" className="p-4 h-full">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : summary ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{summary}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">No summary available</p>
            )}
          </TabsContent>

          <TabsContent value="extracted" className="p-4 h-full">
            {extractedText ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{extractedText}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">No extracted text available</p>
            )}
          </TabsContent>

          <TabsContent value="screenshot" className="h-full">
            {screenshotUrl && (
              <div style={{ marginTop: '20px' }}>
                <h2>Screenshot Preview:</h2>
                <img src={screenshotUrl} alt="Screenshot Preview" style={{ maxWidth: '100%', border: '2px solid #000' }} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="chatbot" className="p-6 flex flex-col h-[80vh]">

{/* Chat Messages Section (Scrollable) */}
<div className="flex-grow overflow-y-auto space-y-4 p-4 mb-[70px]">
  {messages.map((msg, index) => (
    <div
      key={index}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} space-x-2`}
    >
      <div
        className={`text-lg p-2 max-w-[70%] ${msg.role === 'user' ? 'bg-blue-200 rounded-l-xl' : 'bg-gray-200 rounded-r-xl'}`}
      >
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
      </div>
    </div>
  ))}
</div>

{/* Textarea and Button (Fixed at Bottom) */}
<div className="flex items-center gap-4 border-t p-3 bg-white fixed bottom-0 left-0 w-full z-10">
  <textarea
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    cols={30}
    rows={2}
    placeholder="Type your question here..."
    className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  ></textarea>

  <Button
    onClick={generateAnswer}
    disabled={loading}
    className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
  >
    {loading ? 'Sending...' : 'Send'}
  </Button>
</div>
</TabsContent>





        </div>
      </Tabs>
    </div>
  )
}
