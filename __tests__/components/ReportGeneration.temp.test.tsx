import { render, screen, fireEvent } from '../test-utils'
import { ReportGeneration } from '@/components/ReportGeneration.temp'

describe('ReportGeneration Temp Component', () => {
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
})