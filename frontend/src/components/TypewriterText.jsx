import { useState, useEffect } from 'react'

function TypewriterText({ text, onComplete }) {
  const [displayedSegments, setDisplayedSegments] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  
  // 将文本按换行符分割为段落
  // 注意: 处理可能的 \n 字符串
  const prepareSegments = (text) => {
    // 首先替换掉字符串中的 \n 为实际换行符
    const normalizedText = text.replace(/\\n/g, '\n')
    // 然后按实际换行符分段
    return normalizedText.split('\n').filter(segment => segment.trim() !== '')
  }
  
  const segments = prepareSegments(text)
  
  useEffect(() => {
    // 重置状态，当文本改变时
    setDisplayedSegments([])
    setIsComplete(false)
  }, [text])
  
  useEffect(() => {
    // 如果已经显示完所有段落，调用完成回调
    if (isComplete) {
      onComplete && onComplete()
      return
    }
    
    // 已显示的段落数量
    const currentCount = displayedSegments.length
    
    // 如果还有段落未显示
    if (currentCount < segments.length) {
      // 设置定时器，添加下一段
      const timer = setTimeout(() => {
        setDisplayedSegments(prev => [...prev, segments[currentCount]])
        
        // 检查是否是最后一段
        if (currentCount + 1 >= segments.length) {
          setIsComplete(true)
        }
      }, currentCount === 0 ? 0 : 1500) // 第一段立即显示，之后每段间隔1.5秒
      
      return () => clearTimeout(timer)
    }
  }, [displayedSegments, segments, isComplete, onComplete])
  
  return (
    <div className="typewriter-text">
      {displayedSegments.map((segment, index) => (
        <p key={index} className={`paragraph ${index === displayedSegments.length - 1 ? 'new-paragraph' : ''}`}>
          {segment}
        </p>
      ))}
    </div>
  )
}

export default TypewriterText
