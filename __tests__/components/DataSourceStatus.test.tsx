import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DataSourceStatus } from '@/components/DataSourceStatus'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

// 定义模拟的API响应
const mockApiResponse = {
  sources: {
    web: { available: true, name: '智谱Web搜索' },
    firecrawl: { available: false, name: 'Firecrawl网页抓取' },
    ollama: { available: true, name: 'Ollama本地模型' },
    free: { available: false, name: '免费搜索引擎' }
  },
  lastUpdate: new Date().toISOString()
}

// 设置模拟服务器
const server = setupServer(
  http.get('/api/data-sources/status', () => {
    return HttpResponse.json(mockApiResponse)
  })
)

describe('DataSourceStatus Component', () => {
  // 在所有测试开始前启动服务器
  beforeAll(() => server.listen())

  // 在每个测试后重置处理器，以防测试间相互影响
  afterEach(() => server.resetHandlers())

  // 在所有测试结束后关闭服务器
  afterAll(() => server.close())

  it('应该正确渲染数据源状态监控', async () => {
    render(<DataSourceStatus />)
    
    // 检查标题
    expect(screen.getByText('数据源状态监控')).toBeInTheDocument()
    
    // 检查刷新按钮
    expect(screen.getByText('刷新')).toBeInTheDocument()
    
    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('配置完成度')).toBeInTheDocument()
    })
  })

  it('应该显示配置完成度统计', async () => {
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      // 检查配置统计 (2/4 已配置 = 50%)
      expect(screen.getByText('2/4 已配置')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  it('应该显示数据源状态列表', async () => {
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      // 检查数据源名称
      expect(screen.getByText('智谱Web搜索')).toBeInTheDocument()
      expect(screen.getByText('Firecrawl网页抓取')).toBeInTheDocument()
      expect(screen.getByText('Ollama本地模型')).toBeInTheDocument()
      expect(screen.getByText('免费搜索引擎')).toBeInTheDocument()
    })
  })

  it('应该正确显示已配置和未配置状态', async () => {
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      // 检查已配置状态
      const configuredBadges = screen.getAllByText('已配置')
      expect(configuredBadges).toHaveLength(2)
      
      // 检查未配置状态
      const unconfiguredBadges = screen.getAllByText('未配置')
      expect(unconfiguredBadges).toHaveLength(2)
      
      // 检查连接状态文本
      expect(screen.getAllByText('连接正常')).toHaveLength(2)
      expect(screen.getAllByText('需要配置API密钥')).toHaveLength(2)
    })
  })

  it('应该显示配置提示信息', async () => {
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      // 检查配置提示
      expect(screen.getByText('配置提示')).toBeInTheDocument()
      expect(screen.getByText(/部分数据源未配置/)).toBeInTheDocument()
      expect(screen.getByText('查看配置指南')).toBeInTheDocument()
    })
  })

  it('应该能够刷新数据源状态', async () => {
    const mockOnRefresh = jest.fn()
    render(<DataSourceStatus onRefresh={mockOnRefresh} />)
    
    // 等待初始加载完成
    await waitFor(() => {
      expect(screen.getByText('配置完成度')).toBeInTheDocument()
    })
    
    // 点击刷新按钮
    const refreshButton = screen.getByText('刷新')
    fireEvent.click(refreshButton)
    
    // 验证回调被调用
    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled()
    })
  })

  it('应该显示最后更新时间', async () => {
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      expect(screen.getByText(/最后更新:/)).toBeInTheDocument()
    })
  })

  it('应该在刷新时显示加载状态', async () => {
    render(<DataSourceStatus />)
    
    // 等待初始加载完成
    await waitFor(() => {
      expect(screen.getByText('配置完成度')).toBeInTheDocument()
    })
    
    // 点击刷新按钮
    const refreshButton = screen.getByText('刷新')
    fireEvent.click(refreshButton)
    
    // 等待加载状态更新
    await waitFor(() => {
      expect(refreshButton).toBeDisabled()
    }, { timeout: 1000 })
  })

  it('应该正确计算配置完成度百分比', async () => {
    // Mock不同的API响应
    server.use(
      http.get('/api/data-sources/status', () => {
        return HttpResponse.json({
          sources: {
            '数据源1': { available: true },
            '数据源2': { available: true },
            '数据源3': { available: true },
            '数据源4': { available: false }
          },
          lastUpdate: new Date().toISOString()
        })
      })
    )
    
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      // 3/4 = 75%
      expect(screen.getByText('3/4 已配置')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  it('应该处理空数据源状态', async () => {
    // Mock空的API响应
    server.use(
      http.get('/api/data-sources/status', () => {
        return HttpResponse.json({
          sources: {},
          lastUpdate: new Date().toISOString()
        })
      })
    )
    
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('0/0 已配置')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  it('应该处理全部配置完成的情况', async () => {
    // Mock全部配置完成的API响应
    server.use(
      http.get('/api/data-sources/status', () => {
        return HttpResponse.json({
          sources: {
            '数据源1': { available: true },
            '数据源2': { available: true }
          },
          lastUpdate: new Date().toISOString()
        })
      })
    )
    
    render(<DataSourceStatus />)
    
    await waitFor(() => {
      expect(screen.getByText('2/2 已配置')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
      
      // 全部配置完成时不应该显示配置提示
      expect(screen.queryByText('配置提示')).not.toBeInTheDocument()
    })
  })
})