// test-utils.tsx 的测试用例
import { render, mockReportData, mockDataSources } from './test-utils'
import React from 'react'

describe('测试工具函数', () => {
  describe('mockReportData', () => {
    it('应该包含正确的报告数据结构', () => {
      expect(mockReportData).toHaveProperty('id')
      expect(mockReportData).toHaveProperty('title')
      expect(mockReportData).toHaveProperty('content')
      expect(mockReportData).toHaveProperty('createdAt')
      expect(mockReportData).toHaveProperty('status')
      expect(mockReportData).toHaveProperty('quality')
      
      expect(mockReportData.quality).toHaveProperty('score')
      expect(mockReportData.quality).toHaveProperty('issues')
      expect(Array.isArray(mockReportData.quality.issues)).toBe(true)
    })

    it('应该有合理的默认值', () => {
      expect(mockReportData.id).toBe('test-report-1')
      expect(mockReportData.title).toBe('测试报告')
      expect(mockReportData.status).toBe('completed')
      expect(mockReportData.quality.score).toBe(85)
    })
  })

  describe('mockDataSources', () => {
    it('应该包含测试数据源数组', () => {
      expect(Array.isArray(mockDataSources)).toBe(true)
      expect(mockDataSources.length).toBeGreaterThan(0)
    })

    it('每个数据源应该有正确的结构', () => {
      mockDataSources.forEach(source => {
        expect(source).toHaveProperty('id')
        expect(source).toHaveProperty('name')
        expect(source).toHaveProperty('status')
        expect(source).toHaveProperty('lastUpdated')
      })
    })

    it('应该包含不同状态的数据源', () => {
      const statuses = mockDataSources.map(source => source.status)
      expect(statuses).toContain('connected')
      expect(statuses).toContain('error')
    })
  })

  describe('render函数', () => {
    it('应该能够渲染React组件', () => {
      const TestComponent = () => <div data-testid="test">测试组件</div>
      const { getByTestId } = render(<TestComponent />)
      expect(getByTestId('test')).toBeInTheDocument()
    })
  })
})