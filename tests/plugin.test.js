import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp } from 'vue'
import { mount } from '@vue/test-utils'
import VueComponentDebug from '../src/index.js'

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('VueComponentDebug Plugin', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log)
    vi.spyOn(console, 'info').mockImplementation(mockConsole.info)
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn)
    vi.spyOn(console, 'error').mockImplementation(mockConsole.error)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockConsole.log.mockClear()
    mockConsole.info.mockClear()
    mockConsole.warn.mockClear()
    mockConsole.error.mockClear()
  })

  it('installs plugin with default options', () => {
    const app = createApp({})
    const mockMixin = vi.fn()
    app.mixin = mockMixin

    VueComponentDebug.install(app)

    expect(mockMixin).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Function),
        methods: expect.any(Object),
        created: expect.any(Function),
        mounted: expect.any(Function),
        beforeUnmount: expect.any(Function)
      })
    )
  })

  it('installs plugin with custom options', () => {
    const app = createApp({})
    const mockMixin = vi.fn()
    app.mixin = mockMixin

    const options = {
      enabled: true,
      logLevel: 'info',
      prefix: '[Custom]'
    }

    VueComponentDebug.install(app, options)

    expect(mockMixin).toHaveBeenCalled()
    
    // Test that the mixin was created with the right options
    const mixinArg = mockMixin.mock.calls[0][0]
    const data = mixinArg.data()
    expect(data.$debugEnabled).toBe(true)
    expect(data.$debugPrefix).toBe('[Custom]')
  })

  it('adds debug methods to all components when installed globally', () => {
    const TestComponent = {
      name: 'TestComponent',
      template: '<div>Test</div>',
      mounted() {
        this.$debug('Global mixin test')
      }
    }

    // Mount with global plugin
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[VueComponentDebug, { enabled: true }]]
      }
    })

    const vm = wrapper.vm

    expect(vm.$debug).toBeDefined()
    expect(vm.$debugInfo).toBeDefined()
    expect(vm.$debugWarn).toBeDefined()
    expect(vm.$debugError).toBeDefined()

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Global mixin test'
    )
  })

  it('works with multiple components', () => {
    const Component1 = {
      name: 'Component1',
      template: '<div>Component 1</div>',
      mounted() {
        this.$debug('Component 1 mounted')
      }
    }

    const Component2 = {
      name: 'Component2',
      template: '<div>Component 2</div>',
      mounted() {
        this.$debug('Component 2 mounted')
      }
    }

    mount(Component1, {
      global: {
        plugins: [[VueComponentDebug, { enabled: true }]]
      }
    })

    mount(Component2, {
      global: {
        plugins: [[VueComponentDebug, { enabled: true }]]
      }
    })

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [Component1]',
      'Component 1 mounted'
    )

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [Component2]',
      'Component 2 mounted'
    )
  })

  it('respects environment-based default enabling', () => {
    const originalEnv = process.env.NODE_ENV
    
    // Test development mode (should be enabled by default)
    process.env.NODE_ENV = 'development'
    
    const TestComponent = {
      name: 'TestComponent',
      template: '<div>Test</div>',
      mounted() {
        this.$debug('Development mode test')
      }
    }

    mount(TestComponent, {
      global: {
        plugins: [VueComponentDebug] // No explicit options
      }
    })

    expect(mockConsole.log).toHaveBeenCalled()

    // Restore original environment
    process.env.NODE_ENV = originalEnv
  })
})