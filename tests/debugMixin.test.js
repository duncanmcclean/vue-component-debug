import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createDebugMixin } from '../src/mixins/debugMixin.js'

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

describe('createDebugMixin', () => {
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

  it('creates a mixin with default options', () => {
    const mixin = createDebugMixin()
    
    expect(mixin).toHaveProperty('data')
    expect(mixin).toHaveProperty('methods')
    expect(mixin).toHaveProperty('created')
    expect(mixin).toHaveProperty('mounted')
    expect(mixin).toHaveProperty('beforeUnmount')
  })

  it('creates a mixin with custom options', () => {
    const options = {
      enabled: true,
      logLevel: 'info',
      prefix: '[Custom Debug]'
    }
    
    const mixin = createDebugMixin(options)
    const data = mixin.data()
    
    expect(data.$debugEnabled).toBe(true)
    expect(data.$debugPrefix).toBe('[Custom Debug]')
  })

  it('provides debug methods to component', () => {
    const TestComponent = {
      name: 'TestComponent',
      mixins: [createDebugMixin({ enabled: true })],
      template: '<div>Test</div>'
    }

    const wrapper = mount(TestComponent)
    const vm = wrapper.vm

    expect(vm.$debug).toBeDefined()
    expect(vm.$debugInfo).toBeDefined()
    expect(vm.$debugWarn).toBeDefined()
    expect(vm.$debugError).toBeDefined()
  })

  it('logs debug messages when enabled', () => {
    const TestComponent = {
      name: 'TestComponent',
      mixins: [createDebugMixin({ enabled: true, logLevel: 'debug' })],
      template: '<div>Test</div>',
      mounted() {
        this.$debug('Test debug message', { data: 'test' })
      }
    }

    mount(TestComponent)

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Test debug message',
      { data: 'test' }
    )
  })

  it('does not log when disabled', () => {
    const TestComponent = {
      name: 'TestComponent',
      mixins: [createDebugMixin({ enabled: false })],
      template: '<div>Test</div>',
      mounted() {
        this.$debug('This should not log')
      }
    }

    mount(TestComponent)

    expect(mockConsole.log).not.toHaveBeenCalled()
  })

  it('respects log level filtering', () => {
    const TestComponent = {
      name: 'TestComponent',
      mixins: [createDebugMixin({ enabled: true, logLevel: 'warn' })],
      template: '<div>Test</div>',
      mounted() {
        this.$debug('Debug message') // Should not log
        this.$debugInfo('Info message') // Should not log
        this.$debugWarn('Warn message') // Should log
        this.$debugError('Error message') // Should log
      }
    }

    mount(TestComponent)

    expect(mockConsole.log).not.toHaveBeenCalled()
    expect(mockConsole.info).not.toHaveBeenCalled()
    expect(mockConsole.warn).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Warn message'
    )
    expect(mockConsole.error).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Error message'
    )
  })

  it('uses custom prefix in log messages', () => {
    const TestComponent = {
      name: 'TestComponent',
      mixins: [createDebugMixin({ 
        enabled: true, 
        prefix: '[Custom Prefix]' 
      })],
      template: '<div>Test</div>',
      mounted() {
        this.$debug('Test message')
      }
    }

    mount(TestComponent)

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Custom Prefix] [TestComponent]',
      'Test message'
    )
  })

  it('handles components without names', () => {
    const TestComponent = {
      // No name property
      mixins: [createDebugMixin({ enabled: true })],
      template: '<div>Test</div>',
      mounted() {
        this.$debug('Test message')
      }
    }

    mount(TestComponent)

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [Component]',
      'Test message'
    )
  })

  it('logs lifecycle events automatically', () => {
    const TestComponent = {
      name: 'TestComponent',
      mixins: [createDebugMixin({ enabled: true })],
      template: '<div>Test</div>'
    }

    const wrapper = mount(TestComponent)

    // Check created lifecycle log
    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Component created',
      expect.objectContaining({
        name: 'TestComponent'
      })
    )

    // Check mounted lifecycle log
    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Component mounted',
      expect.objectContaining({
        element: expect.any(Object)
      })
    )

    // Test beforeUnmount
    wrapper.unmount()

    expect(mockConsole.log).toHaveBeenCalledWith(
      '[Vue Debug] [TestComponent]',
      'Component before unmount'
    )
  })

  it('works with different log levels', () => {
    const levels = ['debug', 'info', 'warn', 'error']
    
    levels.forEach(level => {
      const TestComponent = {
        name: 'TestComponent',
        mixins: [createDebugMixin({ enabled: true, logLevel: level })],
        template: '<div>Test</div>',
        mounted() {
          this[`$${level}`](`${level} message`)
        }
      }

      mount(TestComponent)

      expect(mockConsole[level]).toHaveBeenCalledWith(
        '[Vue Debug] [TestComponent]',
        `${level} message`
      )

      mockConsole[level].mockClear()
    })
  })
})