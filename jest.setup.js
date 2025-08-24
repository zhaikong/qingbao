import '@testing-library/jest-dom'

// Mock Web APIs for Jest environment
global.Response = class MockResponse {
  constructor(body, init) {
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new Map()
    this._body = typeof body === 'string' ? body : JSON.stringify(body)
    
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }

  async json() {
    try {
      return JSON.parse(this._body)
    } catch {
      throw new Error('Invalid JSON')
    }
  }

  async text() {
    return this._body
  }

  get ok() {
    return this.status >= 200 && this.status < 300
  }
}

// Mock Request
global.Request = class MockRequest {
  constructor(url, options = {}) {
    this.method = options.method || 'GET'
    this.url = url
    this.headers = new Map()
    
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
    
    this._body = options.body || ''
  }

  async json() {
    try {
      return JSON.parse(this._body)
    } catch {
      throw new Error('Invalid JSON')
    }
  }

  async text() {
    return this._body
  }
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, options = {}) {
      this.method = options.method || 'GET'
      this.url = url
      this.headers = new Map()
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value)
        })
      }
      
      this._body = options.body || ''
    }

    async json() {
      try {
        return JSON.parse(this._body)
      } catch {
        throw new Error('Invalid JSON')
      }
    }

    async text() {
      return this._body
    }
  },
  NextResponse: {
    json: (body, init) => {
      const response = new global.Response(JSON.stringify(body), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers
        }
      })
      return response
    }
  }
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.ZHIPU_API_KEY = 'test-zhipu-key'
process.env.OLLAMA_BASE_URL = 'http://localhost:11434'

// Mock fetch globally
global.fetch = jest.fn()

// Setup for each test
beforeEach(() => {
  fetch.mockClear()
})