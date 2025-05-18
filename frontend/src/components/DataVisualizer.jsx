import { useState, useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import ReactMarkdown from 'react-markdown'  // 导入Markdown解析器

function DataVisualizer({ data, analysisResult }) {
  const chartRef = useRef(null)
  const [chartInstance, setChartInstance] = useState(null)
  const [chartType, setChartType] = useState('bar') // bar, line, pie等
  // 初始化图表
  useEffect(() => {
    if (!chartRef.current) return
    
    // 如果已有图表实例，销毁它
    if (chartInstance) {
      chartInstance.dispose()
    }
    
    // 创建新的图表实例
    const chart = echarts.init(chartRef.current)
    setChartInstance(chart)
    
    // 窗口大小变化时调整图表大小
    const resizeHandler = () => chart.resize()
    window.addEventListener('resize', resizeHandler)
    
    return () => {
      chart.dispose()
      window.removeEventListener('resize', resizeHandler)
    }
  }, [])
  
  // 当数据或图表类型变化时更新图表
  useEffect(() => {
    if (!chartInstance || !data) return
    
    // 根据当前选择的图表类型生成配置
    const option = generateChartOption(data, chartType)
    
    // 应用配置
    chartInstance.setOption(option, true)
  }, [data, chartType, chartInstance])
  
  // 生成图表配置
  const generateChartOption = (data, type) => {
    if (!data || !data.visualization_data || !data.visualization_data.chart_data) {
      return {}
    }
    
    const chartData = data.visualization_data.chart_data
    
    // 根据图表类型生成配置
    switch (type) {
      case 'bar':
        if (!chartData.bar) return { title: { text: '没有可用的柱状图数据' } }
        
        return {
          title: {
            text: '数据分析 - 柱状图',
            left: 'center',
            textStyle: {
              color: '#eee'
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          xAxis: {
            type: 'category',
            data: chartData.bar.categories,
            axisLabel: {
              color: '#ddd'
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: '#ddd'
            }
          },
          series: chartData.bar.series.map(s => ({
            name: s.name,
            type: 'bar',
            data: s.data,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#2378f7' },
                  { offset: 0.7, color: '#2378f7' },
                  { offset: 1, color: '#83bff6' }
                ])
              }
            }
          })),
          backgroundColor: 'transparent'
        }
        
      case 'line':
        if (!chartData.line) return { title: { text: '没有可用的折线图数据' } }
        
        return {
          title: {
            text: '数据分析 - 折线图',
            left: 'center',
            textStyle: {
              color: '#eee'
            }
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: chartData.line.series.map(s => s.name),
            textStyle: {
              color: '#ddd'
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: chartData.line.categories,
            axisLabel: {
              color: '#ddd'
            }
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              color: '#ddd'
            }
          },
          series: chartData.line.series.map((s, index) => ({
            name: s.name,
            type: 'line',
            stack: 'Total',
            data: s.data,
            lineStyle: {
              width: 3
            },
            symbolSize: 8,
            emphasis: {
              focus: 'series'
            }
          })),
          backgroundColor: 'transparent'
        }
        
      case 'pie':
        if (!chartData.pie) return { title: { text: '没有可用的饼图数据' } }
        
        return {
          title: {
            text: '数据分析 - 饼图',
            left: 'center',
            textStyle: {
              color: '#eee'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            textStyle: {
              color: '#ddd'
            }
          },
          series: [
            {
              name: '数据分布',
              type: 'pie',
              radius: '55%',
              center: ['50%', '60%'],
              data: chartData.pie.data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              itemStyle: {
                borderRadius: 10,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 2
              },
              label: {
                color: '#ddd'
              }
            }
          ],
          backgroundColor: 'transparent'
        }
        
      default:
        return {}
    }
  }
  
  return (
    <div className="data-visualizer">
      <div className="chart-controls">
        <select 
          value={chartType} 
          onChange={(e) => setChartType(e.target.value)}
          className="chart-type-selector"
        >
          <option value="bar">柱状图</option>
          <option value="line">折线图</option>
          <option value="pie">饼图</option>
        </select>
      </div>
      
      <div 
        ref={chartRef} 
        className="chart-container"
        style={{ width: '100%', height: '400px' }}
      />
      
      {analysisResult && (
        <div className="analysis-results">
          <h3>数据分析见解</h3>
        <div className="markdown-content">
            <ReactMarkdown>{analysisResult}</ReactMarkdown>
        </div>
        </div>
      )}
    </div>
  )
}

export default DataVisualizer
