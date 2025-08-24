import { NextRequest, NextResponse } from 'next/server'

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'question'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: string
  userInfo?: {
    email?: string
    role?: string
  }
  timestamp: string
  userAgent: string
  url: string
}

export async function POST(request: NextRequest) {
  try {
    const feedbackData: FeedbackData = await request.json()
    
    // 验证必填字段
    if (!feedbackData.title?.trim() || !feedbackData.description?.trim()) {
      return NextResponse.json(
        { error: '标题和描述为必填项' },
        { status: 400 }
      )
    }

    // 记录反馈信息
    console.log('📝 用户反馈收到:', {
      type: feedbackData.type,
      title: feedbackData.title,
      priority: feedbackData.priority,
      category: feedbackData.category,
      timestamp: feedbackData.timestamp,
      hasEmail: !!feedbackData.userInfo?.email,
      url: feedbackData.url
    })

    // 在生产环境中，这里可以：
    // 1. 存储到数据库
    // 2. 发送到项目管理工具（如 Jira, Linear, GitHub Issues）
    // 3. 发送邮件通知给开发团队
    // 4. 集成到客服系统

    if (process.env.NODE_ENV === 'production') {
      // 示例：存储到数据库
      // await storeFeedbackToDatabase(feedbackData)
      
      // 示例：发送邮件通知
      // await sendFeedbackNotification(feedbackData)
      
      // 示例：创建GitHub Issue
      // await createGitHubIssue(feedbackData)
    }

    // 根据反馈类型进行不同处理
    await processFeedbackByType(feedbackData)

    return NextResponse.json({
      success: true,
      message: '反馈提交成功',
      feedbackId: generateFeedbackId(),
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ 反馈处理失败:', error)
    
    return NextResponse.json(
      { 
        error: '反馈提交失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// 根据反馈类型进行处理
async function processFeedbackByType(feedback: FeedbackData) {
  switch (feedback.type) {
    case 'bug':
      console.log('🐛 错误报告:', {
        title: feedback.title,
        priority: feedback.priority,
        category: feedback.category,
        description: feedback.description.substring(0, 200) + '...'
      })
      // 高优先级错误可以立即通知开发团队
      if (feedback.priority === 'high') {
        // await sendUrgentBugAlert(feedback)
      }
      break

    case 'feature':
      console.log('✨ 功能建议:', {
        title: feedback.title,
        category: feedback.category,
        priority: feedback.priority
      })
      // 可以添加到产品路线图
      // await addToProductRoadmap(feedback)
      break

    case 'improvement':
      console.log('🔧 改进建议:', {
        title: feedback.title,
        category: feedback.category,
        priority: feedback.priority
      })
      // 可以添加到改进任务列表
      // await addToImprovementBacklog(feedback)
      break

    case 'question':
      console.log('❓ 用户问题:', {
        title: feedback.title,
        category: feedback.category,
        hasEmail: !!feedback.userInfo?.email
      })
      // 如果用户留了邮箱，可以直接回复
      if (feedback.userInfo?.email) {
        // await sendQuestionResponse(feedback)
      }
      break
  }
}

// 生成反馈ID
function generateFeedbackId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `fb_${timestamp}_${random}`
}

// 获取反馈统计信息（仅开发环境）
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: '仅在开发环境可用' },
      { status: 403 }
    )
  }

  try {
    // 返回反馈系统状态
    return NextResponse.json({
      status: 'active',
      environment: process.env.NODE_ENV,
      feedbackSystem: {
        enabled: true,
        types: ['bug', 'feature', 'improvement', 'question'],
        priorities: ['low', 'medium', 'high'],
        categories: [
          '报告生成', '数据采集', '质量评估', 
          '用户界面', '系统性能', '数据源管理', '其他'
        ]
      },
      processing: {
        storage: 'console', // 可以是 'database', 'external-service' 等
        notifications: false, // 是否启用邮件通知
        integration: {
          github: false,
          jira: false,
          slack: false
        }
      },
      statistics: {
        // 在实际应用中，这里会从数据库获取统计数据
        totalFeedback: 0,
        byType: {
          bug: 0,
          feature: 0,
          improvement: 0,
          question: 0
        },
        byPriority: {
          low: 0,
          medium: 0,
          high: 0
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: '获取反馈系统状态失败', details: error.message },
      { status: 500 }
    )
  }
}