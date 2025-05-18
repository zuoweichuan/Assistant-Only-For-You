import { useState } from 'react'
import './CsvUploader.css' 

function CsvUploader() {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('http://localhost:8000/api/upload_csv', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) throw new Error('上传失败')
      
      // 下载返回的 CSV 文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `filled_${selectedFile.name}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div>
      <label htmlFor="csvUploader">请选择 CSV 文件：</label>
      <input
        id="csvUploader"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        title="请选择CSV文件"
      />
      <button type="button" onClick={handleUpload}>上传并下载</button>
    </div>
  )
}

export default CsvUploader
