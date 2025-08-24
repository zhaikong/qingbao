import { NextResponse } from 'next/server';

export type StepStatus = 'idle' | 'running' | 'completed' | 'error';

export type ProgressStep = {
  id: string;
  progress: number; // 0-100
  status: StepStatus;
  updatedAt: string;
};

export type ProgressState = {
  logs: string[];
  steps: ProgressStep[];
  completed: boolean;
  report: any | null;
  error?: string;
};

// 全局进度容器（提供无类访问的兜底）
declare global {
  // eslint-disable-next-line no-var
  var __PROGRESS_STATE__: ProgressState | undefined;
}

function nowISO() {
  return new Date().toISOString();
}

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

// 简单进度存储（单例）
export class SimpleProgressStore {
  private static instance: SimpleProgressStore | null = null;
  private state: ProgressState;

  private constructor() {
    this.state = {
      logs: [],
      steps: [],
      completed: false,
      report: null,
    };
    (globalThis as any).__PROGRESS_STATE__ = this.state;
  }

  public static getInstance(): SimpleProgressStore {
    if (!this.instance) {
      this.instance = new SimpleProgressStore();
    }
    return this.instance;
  }

  public reset() {
    this.state.logs = [];
    this.state.steps = [];
    this.state.completed = false;
    this.state.report = null;
    delete this.state.error;
    (globalThis as any).__PROGRESS_STATE__ = this.state;
  }

  public addLog(message: string) {
    const line = `[${nowISO()}] ${message}`;
    this.state.logs.push(line);
    // 控制日志长度，防止内存膨胀
    if (this.state.logs.length > 5000) {
      this.state.logs.splice(0, this.state.logs.length - 5000);
    }
  }

  public updateStep(id: string, progress: number, status: StepStatus = 'running') {
    const p = clamp01(progress);
    const idx = this.state.steps.findIndex(s => s.id === id);
    const updated: ProgressStep = {
      id,
      progress: p,
      status,
      updatedAt: nowISO(),
    };
    if (idx >= 0) {
      this.state.steps[idx] = updated;
    } else {
      this.state.steps.push(updated);
    }
  }

  public setError(errMsg: string) {
    this.state.error = errMsg;
    this.addLog(`❌ 错误: ${errMsg}`);
  }

  public setCompleted(finalReport: any) {
    this.state.completed = true;
    this.state.report = finalReport;
    this.updateStep('final', 100, 'completed');
    this.addLog('🎉 任务已完成');
  }

  public getState(): ProgressState {
    // 返回浅拷贝，避免外部直接突变
    return {
      logs: [...this.state.logs],
      steps: [...this.state.steps],
      completed: this.state.completed,
      report: this.state.report,
      error: this.state.error,
    };
  }
}

// GET /api/progress-status
export async function GET() {
  try {
    // 优先使用单例状态
    const store = SimpleProgressStore.getInstance();
    const state = store.getState();
    return NextResponse.json(state, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown_error';
    // 兜底：若单例异常，尝试读取全局对象
    const fallback = (globalThis as any).__PROGRESS_STATE__ as ProgressState | undefined;
    const safe = fallback
      ? { ...fallback, error: msg }
      : { logs: [], steps: [], completed: false, report: null, error: msg };
    return NextResponse.json(safe, { status: 200 });
  }
}