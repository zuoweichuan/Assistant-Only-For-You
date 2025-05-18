import { useEffect } from 'react'
import DataVisualizer from './DataVisualizer'

function VisualizerModal({ data, onClose }) {
  // 按ESC键关闭对话框
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  
  // 点击背景关闭对话框
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  if (!data) return null
  
  return (
    <div className="visualizer-modal-overlay" onClick={handleBackgroundClick}>
      <div className="visualizer-modal-content">
        <button 
          className="close-visualizer"
          onClick={onClose}
        >
          &times;
        </button>
        <h2>数据可视化分析</h2>
        <DataVisualizer 
          data={data} 
          analysisResult={data.analysis}
        />
      </div>
    </div>
  )
}

export default VisualizerModal
