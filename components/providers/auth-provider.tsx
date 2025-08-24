"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: string
  organization?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 检查本地存储的token
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token并获取用户信息
      validateToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateToken = async (token: string) => {
    try {
      // 这里应该调用API验证token
      // 暂时使用模拟数据
      const mockUser: User = {
        id: '1',
        email: 'user@example.com',
        name: '张分析师',
        role: 'analyst',
        organization: '战略研究院'
      }
      setUser(mockUser)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 这里应该调用实际的登录API
      // 暂时使用模拟登录
      if (email && password) {
        const mockUser: User = {
          id: '1',
          email: email,
          name: '张分析师',
          role: 'analyst',
          organization: '战略研究院'
        }
        
        const mockToken = 'mock-jwt-token'
        localStorage.setItem('token', mockToken)
        setUser(mockUser)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/auth/login')
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}