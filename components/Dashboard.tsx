'use client'

export function Dashboard() {
  const stats = [
    {
      title: '活跃项目',
      value: '12',
      change: '+3',
      changeType: 'positive',
      icon: '📊'
    },
    {
      title: '数据源',
      value: '156',
      change: '+12',
      changeType: 'positive',
      icon: '🔍'
    },
    {
      title: '生成报告',
      value: '89',
      change: '+8',
      changeType: 'positive',
      icon: '📝'
    },
    {
      title: '威胁预警',
      value: '23',
      change: '-5',
      changeType: 'negative',
      icon: '⚠️'
    }
  ]

  const recentActivities = [
    {
      type: 'info',
      title: '新项目创建',
      description: '创建了"中美AI政策对比分析"项目',
      time: '2分钟前',
      icon: '🚀'
    },
    {
      type: 'success',
      title: '报告生成完成',
      description: '深度研判报告已生成并导出',
      time: '15分钟前',
      icon: '✅'
    },
    {
      type: 'warning',
      title: '数据源异常',
      description: '检测到某数据源连接不稳定',
      time: '1小时前',
      icon: '⚠️'
    },
    {
      type: 'info',
      title: '系统更新',
      description: 'AI模型已更新到最新版本',
      time: '2小时前',
      icon: '🔄'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="fenghuo-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              欢迎回来，王分析师 👋
            </h2>
            <p className="text-gray-600">
              今天是 {new Date().toLocaleDateString('zh-CN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}，让我们开始新的情报分析工作
            </p>
          </div>
          <div className="text-6xl opacity-20">🔥</div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="fenghuo-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className={`text-sm mt-1 ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {stat.change} 较上周
                </p>
              </div>
              <div className="text-3xl opacity-60">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="fenghuo-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="fenghuo-button-primary flex items-center gap-3 p-4 h-auto">
            <span className="text-xl">🚀</span>
            <div className="text-left">
              <div className="font-medium">创建新项目</div>
              <div className="text-sm opacity-90">开始新的情报分析任务</div>
            </div>
          </button>
          
          <button className="fenghuo-button-secondary flex items-center gap-3 p-4 h-auto">
            <span className="text-xl">📝</span>
            <div className="text-left">
              <div className="font-medium">生成报告</div>
              <div className="text-sm opacity-90">使用AI快速生成分析报告</div>
            </div>
          </button>
          
          <button className="fenghuo-button-secondary flex items-center gap-3 p-4 h-auto">
            <span className="text-xl">🔍</span>
            <div className="text-left">
              <div className="font-medium">数据采集</div>
              <div className="text-sm opacity-90">配置和管理数据源</div>
            </div>
          </button>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="fenghuo-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{activity.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-2">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 系统状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="fenghuo-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI模型服务</span>
              <span className="status-running">运行中</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">数据采集引擎</span>
              <span className="status-running">运行中</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">搜索引擎</span>
              <span className="status-running">运行中</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">数据库</span>
              <span className="status-running">运行中</span>
            </div>
          </div>
        </div>

        <div className="fenghuo-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">资源使用</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">CPU使用率</span>
                <span className="font-medium">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '23%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">内存使用率</span>
                <span className="font-medium">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '67%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">存储使用率</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '45%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}