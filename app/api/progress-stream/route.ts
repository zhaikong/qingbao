import { NextRequest } from 'next/server'
import { SimpleProgressStore } from '../progress-status/route'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) => {
        const msg = `data: ${JSON.stringify(obj)}\n\n`
        controller.enqueue(encoder.encode(msg))
      }

      // 初始连接提示
      send({
        type: 'connected',
        message: '进度流已连接',
        timestamp: new Date().toISOString(),
      })

      const store = SimpleProgressStore.getInstance()

      // 定时将后端进度状态“转换”为前端订阅的事件类型推送
      const interval = setInterval(() => {
        try {
          const status = store.getStatus()
          const now = new Date().toISOString()

          // 推送最新日志（简单做法：整批推送，前端只展示尾部）
          if (status.logs && status.logs.length) {
            send({
              type: 'log',
              message: status.logs[status.logs.length - 1],
              timestamp: now,
            })
          }

          // 推送各步骤进度
          if (status.steps && status.steps.length) {
            for (const step of status.steps) {
              send({
                type: 'progress',
                stepId: step.id,
                progress: step.progress,
                status: step.status,
                updatedAt: step.updatedAt,
                timestamp: now,
              })
            }
          }

          // 推送完成事件
          if (status.completed) {
            send({
              type: 'complete',
              report: status.report,
              timestamp: now,
            })
          }
        } catch (e: any) {
          send({
            type: 'log',
            message: `进度推送异常: ${e?.message || String(e)}`,
            timestamp: new Date().toISOString(),
          })
        }
      }, 1000)

      const onAbort = () => {
        clearInterval(interval)
        try { controller.close() } catch {}
      }
      request.signal.addEventListener('abort', onAbort)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}