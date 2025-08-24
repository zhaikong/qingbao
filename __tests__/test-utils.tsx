import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Toaster } from '@/components/ui/toaster'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      {children}
      <Toaster />
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock data for testing
export const mockProject = {
  id: '1',
  name: '测试项目',
  description: '这是一个测试项目',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'test-user-id'
}

export const mockReport = {
  id: '1',
  project_id: '1',
  title: '测试报告',
  content: '这是一个测试报告的内容',
  status: 'completed',
  quality_score: 85,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockReportData = {
  id: 'test-report-1',
  title: '测试报告',
  content: '这是一个测试报告的内容',
  createdAt: '2024-01-01T00:00:00Z',
  status: 'completed' as const,
  quality: {
    score: 85,
    issues: []
  }
}

export const mockDataSources = [
  {
    id: 'source-1',
    name: '测试数据源1',
    status: 'connected' as const,
    lastUpdated: '2024-01-01T00:00:00Z'
  },
  {
    id: 'source-2', 
    name: '测试数据源2',
    status: 'error' as const,
    lastUpdated: '2024-01-01T00:00:00Z'
  }
]

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

// Mock fetch for API testing
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue(mockApiResponse(response, status))
}

// Clean up mocks
export const cleanupMocks = () => {
  jest.clearAllMocks()
  if (global.fetch && typeof global.fetch === 'function') {
    (global.fetch as jest.Mock).mockClear()
  }
}