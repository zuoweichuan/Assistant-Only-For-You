import { useState, useRef, useEffect } from 'react'
import Live2DDisplay from './components/Live2DModel'
import './App.css'
import LoadingDots from './components/LoadingDots'

import VisualizerModal from './components/VisualizerModal'
import TypewriterText from './components/TypewriterText'

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [messageLoading, setMessageLoading] = useState(false)  // 用于消息生成
  const [analysisLoading, setAnalysisLoading] = useState(false)  // 用于数据分析
  const live2dRef = useRef(null)
  const [isTracking, setIsTracking] = useState(true)

  const [uploading, setUploading] = useState(false)
  const [csvResult, setCsvResult] = useState(null)
  const fileInputRef = useRef(null)

  const [analysisData, setAnalysisData] = useState(null)
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [fillRequirement, setFillRequirement] = useState('')
  
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault() // 防止空格键触发其他操作
        setIsTracking(!isTracking)
        if (live2dRef.current) {
          live2dRef.current.setTracking(!isTracking)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isTracking])

    // 添加CSV文件上传处理函数
  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file || !file.name.endsWith('.csv')) {
      alert('请上传CSV文件')
      return
    }

    setUploading(true)
    setCsvResult(null)

    // 添加上传文件的消息，包含填写要求
    const uploadMessage = fillRequirement 
      ? `我上传了CSV文件: ${file.name}，填写要求：${fillRequirement}` 
      : `我上传了CSV文件: ${file.name}`

      // 添加上传文件的消息
      setMessages(prev => [
        ...prev, 
        { 
          type: 'user', // 注意这里是type而不是role
          content: uploadMessage // 使用包含要求的消息
        }
      ])
    
    const formData = new FormData()
    formData.append('file', file)
    
    // 添加填写要求到FormData
    if (fillRequirement) {
      formData.append('requirement', fillRequirement)
    }
  
    try {
      const response = await fetch('http://localhost:8000/api/upload-csv', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      setCsvResult(result)
      
      // 添加处理结果的消息
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: result.success 
            ? `CSV文件处理成功！${result.message}${result.download_filename ? '，您可以下载处理后的文件。' : ''}` 
            : `处理文件时出错: ${result.message}`
        }
      ])
    } catch (error) {
      console.error('上传文件时出错:', error)
      setCsvResult({
        success: false,
        message: `请求失败: ${error.message}`
      })
      
      // 添加错误消息
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `上传文件时出错: ${error.message}` 
        }
      ])
    } finally {
      setUploading(false)
      // 重置文件输入以允许再次上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  const handleSubmit = async () => {
    if (!input.trim()) return
    setMessageLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          session_id: 'default' 
        }),
      })
      
      const data = await response.json()
      
      // 设置表情
      if (data.expression && live2dRef.current) {
        live2dRef.current.showExpression(data.expression)
      }
      
      // 检查音频数据是否存在且有效
      if (data.audio && data.audio.length > 0) {
        try {
          const audioBlob = new Blob(
            [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
            { type: 'audio/mpeg' }
          )
          const audioUrl = URL.createObjectURL(audioBlob)
          
          const audio = new Audio(audioUrl)
          audio.onerror = (e) => {
            console.error('Audio playback error:', e)
          }
          
          await audio.play()
          
          // 播放完成后释放 URL
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            // 音频播放结束后延迟1秒重置表情
            setTimeout(() => {
              if (live2dRef.current) {
                live2dRef.current.showExpression(data.expression, false)
              }
            }, 1000)  // 1000ms = 1秒
          }
        } catch (audioError) {
          console.error('Audio processing error:', audioError)
        }
      }
      
      // 更新消息
      setMessages([
        ...messages,
        { type: 'user', content: input },
        { type: 'assistant', content: data.message }
      ])
      setInput('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setMessageLoading(false)
    }
  }

  const handleSendMessage = async () => {
    // 原有的消息发送逻辑
    handleSubmit()
  }

  // 处理文件上传成功后的操作，添加分析按钮功能
  const handleAnalyzeData = async (filePath) => {
    try {
      // 显示正在处理的消息
      const analyzeMessage = fillRequirement 
      ? `请根据"${fillRequirement}"的要求分析这些数据并生成可视化图表` 
      : '请分析这些数据并生成可视化图表'
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'user', 
          content: analyzeMessage 
        }
      ])
      
      setAnalysisLoading(true)
      
      // 调用分析API
      const response = await fetch('http://localhost:8000/api/analyze-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath ,
          requirement: fillRequirement 
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 保存分析结果
        setAnalysisData(result)
        
        // 显示分析完成的消息
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: `分析完成！以下是主要发现:\n\n${result.analysis}` 
          }
        ])
        
        // 显示可视化对话框
        setShowVisualizer(true)
      } else {
        // 显示错误消息
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: `分析失败: ${result.message}` 
          }
        ])
      }
    } catch (error) {
      console.error('分析请求失败:', error)
      // 显示错误消息
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `分析请求失败: ${error.message}` 
        }
      ])
    } finally {
      setAnalysisLoading(false)
    }
  }

  // 获取最后一条助手消息
  const lastAssistantMessage = messages
    .filter(msg => msg.type === 'assistant')
    .at(-1)

  return (
    <div className="app">
    <div className="live2d-main">
      <Live2DDisplay ref={live2dRef} />
      {/* 当showVisualizer为true时隐藏字幕 */}
      {!showVisualizer && (
        <div className="subtitles">
          {messageLoading ? (
            <div className="subtitle-text loading">
              ...
            </div>
          ) : lastAssistantMessage && (
            <div className="subtitle-text">
              <TypewriterText 
                text={lastAssistantMessage.content} 
                onComplete={() => console.log('文本显示完成')}
              />
            </div>
          )}
        </div>
      )}
    </div>

    {/* 注意：确保此容器在Live2D下面，输入框上面 */}
    {/* 重新组织文件上传区域为单行布局 */}
    <div className="file-upload-container">
      {/* 上传按钮 */}
      <div className="upload-button-wrapper">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          disabled={uploading || messageLoading || analysisLoading}
          style={{ display: 'none' }}
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className={`file-upload-button ${(uploading || messageLoading || analysisLoading) ? 'disabled' : ''}`}>
          {uploading ? '上传处理中...' : '上传CSV文件'}
        </label>
      </div>
      
      {/* 填写要求输入框 */}
      <div className="fill-requirement-container">
        <input
          type="text"
          value={fillRequirement}
          onChange={(e) => setFillRequirement(e.target.value)}
          placeholder="输入CSV填写/分析要求（可选）"
          className="fill-requirement-input"
          disabled={uploading}
        />
      </div>
      
      {/* 下载按钮 */}
      {csvResult && csvResult.success && csvResult.download_filename && (
        <a 
          href={`http://localhost:8000/api/download/${csvResult.download_filename}`}
          download
          className="download-button"
        >
          下载CSV
        </a>
      )}
      
      {/* 分析按钮 */}
      {csvResult && csvResult.success && csvResult.file_path && (
        <button
          className="analyze-button"
          onClick={() => handleAnalyzeData(csvResult.file_path)}
          disabled={messageLoading || analysisLoading}
        >
          {analysisLoading ? '分析中...' : '分析数据'}
        </button>
      )}
    </div>

      {showVisualizer && analysisData && (
        <VisualizerModal
          data={analysisData}
          onClose={() => setShowVisualizer(false)}
        />
      )}
      {/* 输入区域 */}
      <div className="chat-input-container">
	<input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="输入消息..."
        />
      </div>
    </div>
  )
}

export default App

