import { render, screen, fireEvent, waitFor } from '../test-utils'
import { ReportGeneration } from '@/components/ReportGeneration'
import { mockFetch, cleanupMocks } from '../test-utils'

// Mock the API response
const mockReportResponse = {
  success: true,
  report: '# 测试报告\n\n这是一个测试生成的报告内容。',
  metadata: {
    wordCount: 100,
    dataSourceCount: 5,
    processingTime: 3.2,
    template: 'comprehensive'
  },
  qualityAssessment: {
    overallScore: 85,
    contentQuality: 90,
    structureQuality: 80,
    dataReliability: 85,
    completeness: 88
  }
}

describe('ReportGeneration Component', () => {
  beforeEach(() => {
    cleanupMocks()
  })

  it('应该正确渲染报告生成页面', () => {
    render(<ReportGeneration />)
    
    // 检查页面标题
    expect(screen.getByText('AI报告生成')).toBeInTheDocument()
    expect(screen.getByText('基于深度研判模板的智能报告生成')).toBeInTheDocument()
    
    // 检查输入区域
    expect(screen.getByText('分析议题')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')).toBeInTheDocument()
    
    // 检查生成按钮
    expect(screen.getByText('开始生成高质量报告')).toBeInTheDocument()
  })

  it('应该显示报告模板选择器', () => {
    render(<ReportGeneration />)
    
    // 检查模板选择器
    expect(screen.getByText('报告模板')).toBeInTheDocument()
    
    const templateSelect = screen.getByDisplayValue('综合分析报告')
    expect(templateSelect).toBeInTheDocument()
  })

  it('应该显示分析深度选择器', () => {
    render(<ReportGeneration />)
    
    // 检查分析深度选择器
    expect(screen.getByText('分析深度')).toBeInTheDocument()
    
    const depthSelect = screen.getByDisplayValue('详细分析')
    expect(depthSelect).toBeInTheDocument()
  })

  it('应该在没有输入议题时禁用生成按钮', () => {
    render(<ReportGeneration />)
    
    const generateButton = screen.getByText('开始生成高质量报告')
    expect(generateButton).toBeDisabled()
  })

  it('应该在输入议题后启用生成按钮', () => {
    render(<ReportGeneration />)
    
    const topicInput = screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')
    fireEvent.change(topicInput, { target: { value: '人工智能发展趋势' } })
    
    const generateButton = screen.getByText('开始生成高质量报告')
    expect(generateButton).not.toBeDisabled()
  })

  it('应该能够成功生成报告', async () => {
    mockFetch(mockReportResponse)
    
    render(<ReportGeneration />)
    
    // 输入议题
    const topicInput = screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')
    fireEvent.change(topicInput, { target: { value: '人工智能发展趋势' } })
    
    // 点击生成按钮
    const generateButton = screen.getByText('开始生成高质量报告')
    fireEvent.click(generateButton)
    
    // 检查生成中状态
    expect(screen.getByText('生成中...')).toBeInTheDocument()
    expect(screen.getByText('生成进度')).toBeInTheDocument()
    
    // 等待报告生成完成 - 检查报告内容是否包含在页面中
    await waitFor(() => {
      const reportContent = screen.getByText(/测试报告/)
      expect(reportContent).toBeInTheDocument()
    }, { timeout: 10000 })
    
    // 检查报告预览区域不再显示等待状态
    expect(screen.queryByText('等待生成报告')).not.toBeInTheDocument()
  }, 15000)

  it('应该显示生成进度步骤', async () => {
    mockFetch(mockReportResponse)
    
    render(<ReportGeneration />)
    
    // 输入议题并开始生成
    const topicInput = screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')
    fireEvent.change(topicInput, { target: { value: '人工智能发展趋势' } })
    
    const generateButton = screen.getByText('开始生成高质量报告')
    fireEvent.click(generateButton)
    
    // 检查生成步骤
    expect(screen.getByText('AI侦察')).toBeInTheDocument()
    expect(screen.getByText('信息采集')).toBeInTheDocument()
    expect(screen.getByText('数据分诊')).toBeInTheDocument()
    expect(screen.getByText('智能生成')).toBeInTheDocument()
    expect(screen.getByText('完成')).toBeInTheDocument()
  })

  it('应该显示报告元数据', async () => {
    mockFetch(mockReportResponse)
    
    render(<ReportGeneration />)
    
    // 生成报告
    const topicInput = screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')
    fireEvent.change(topicInput, { target: { value: '人工智能发展趋势' } })
    
    const generateButton = screen.getByText('开始生成高质量报告')
    fireEvent.click(generateButton)
    
    // 等待报告生成完成
    await waitFor(() => {
      expect(screen.getByText('字数统计：')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('数据源：')).toBeInTheDocument()
      expect(screen.getByText('5个')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('应该显示导出按钮在报告生成后', async () => {
    mockFetch(mockReportResponse)
    
    render(<ReportGeneration />)
    
    // 生成报告
    const topicInput = screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')
    fireEvent.change(topicInput, { target: { value: '人工智能发展趋势' } })
    
    const generateButton = screen.getByText('开始生成高质量报告')
    fireEvent.click(generateButton)
    
    // 等待报告生成完成
    await waitFor(() => {
      expect(screen.getByText('导出报告')).toBeInTheDocument()
      expect(screen.getByText('编辑报告')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('应该处理API错误', async () => {
    mockFetch({ success: false, error: '生成失败' }, 500)
    
    // Mock alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<ReportGeneration />)
    
    // 输入议题并尝试生成
    const topicInput = screen.getByPlaceholderText('例如：中美AI领域最新政策对比分析')
    fireEvent.change(topicInput, { target: { value: '人工智能发展趋势' } })
    
    const generateButton = screen.getByText('开始生成高质量报告')
    fireEvent.click(generateButton)
    
    // 等待错误处理
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('报告生成失败'))
    }, { timeout: 5000 })
    
    alertSpy.mockRestore()
  })

  it('应该显示模板信息', () => {
    render(<ReportGeneration />)
    
    // 检查模板信息
    expect(screen.getByText('使用模板')).toBeInTheDocument()
    expect(screen.getByText('深度研判报告')).toBeInTheDocument()
    expect(screen.getByText('包含背景分析、多维度分析、趋势预测、风险评估和对策建议的完整结构')).toBeInTheDocument()
    
    // 检查模板标签
    expect(screen.getByText('执行摘要')).toBeInTheDocument()
    expect(screen.getByText('背景分析')).toBeInTheDocument()
    expect(screen.getByText('深度分析')).toBeInTheDocument()
    expect(screen.getByText('趋势预测')).toBeInTheDocument()
    expect(screen.getByText('对策建议')).toBeInTheDocument()
  })

  it('应该显示系统说明', () => {
    render(<ReportGeneration />)
    
    // 检查系统说明
    expect(screen.getByText('智能报告生成系统 v2.0')).toBeInTheDocument()
    expect(screen.getByText('基于多源数据采集和AI智能分析的专业报告生成系统，支持实时质量评估和多种报告模板。')).toBeInTheDocument()
    
    // 检查功能标签
    expect(screen.getByText('多源数据采集')).toBeInTheDocument()
    expect(screen.getByText('智能质量评估')).toBeInTheDocument()
    expect(screen.getByText('专业报告模板')).toBeInTheDocument()
    expect(screen.getByText('实时状态监控')).toBeInTheDocument()
  })
})