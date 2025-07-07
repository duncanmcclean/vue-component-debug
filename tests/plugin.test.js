import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from 'vue';
import { mount } from '@vue/test-utils';
import VueComponentDebug from '../src/index.js';

describe('VueComponentDebug Plugin', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('installs plugin and adds mixin to app', () => {
        const app = createApp({});
        const mockMixin = vi.fn();
        app.mixin = mockMixin;

        VueComponentDebug.install(app);

        expect(mockMixin).toHaveBeenCalledWith(
            expect.objectContaining({
                mounted: expect.any(Function),
                beforeUnmount: expect.any(Function),
            }),
        );
    });

    it('adds debug comments to all components when installed globally in development', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            name: 'TestComponent',
            template: '<div>Test</div>',
        };

        // Mount with global plugin
        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [VueComponentDebug],
            },
        });

        const element = wrapper.element;

        // Check for debug comments (will use "Anonymous" since __file is not available in test)
        expect(element.previousSibling?.nodeType).toBe(Node.COMMENT_NODE);
        expect(element.previousSibling?.nodeValue).toBe(' Start component: Anonymous ');
        expect(element.nextSibling?.nodeType).toBe(Node.COMMENT_NODE);
        expect(element.nextSibling?.nodeValue).toBe(' End component: Anonymous ');

        wrapper.unmount();
    });

    it('works with multiple components', () => {
        process.env.NODE_ENV = 'development';

        const Component1 = {
            template: '<div>Component 1</div>',
        };

        const Component2 = {
            template: '<div>Component 2</div>',
        };

        const wrapper1 = mount(Component1, {
            attachTo: document.body,
            global: {
                plugins: [VueComponentDebug],
            },
        });

        const wrapper2 = mount(Component2, {
            attachTo: document.body,
            global: {
                plugins: [VueComponentDebug],
            },
        });

        // Both should use "Anonymous" since no component identifier is available in test environment
        expect(wrapper1.element.previousSibling?.nodeValue).toBe(' Start component: Anonymous ');
        expect(wrapper2.element.previousSibling?.nodeValue).toBe(' Start component: Anonymous ');

        wrapper1.unmount();
        wrapper2.unmount();
    });

    it('does not add comments in production mode', () => {
        process.env.NODE_ENV = 'production';

        const TestComponent = {
            name: 'TestComponent',
            __file: 'src/components/TestComponent.vue',
            template: '<div>Test</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [VueComponentDebug],
            },
        });

        const element = wrapper.element;

        // Should not have comment siblings in production
        expect(element.previousSibling).toBeNull();
        expect(element.nextSibling).toBeNull();

        wrapper.unmount();
    });

    it('handles app parameter gracefully when undefined', () => {
        // Test that the plugin throws when app doesn't have mixin method
        expect(() => {
            VueComponentDebug.install();
        }).toThrow('app.mixin is not a function');
    });

    it('cleans up comments when components are unmounted globally', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            __file: 'src/components/TestComponent.vue',
            template: '<div>Test Content</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [VueComponentDebug],
            },
        });

        const element = wrapper.element;
        const parent = element.parentNode;

        // Store references to comments
        const startComment = element.previousSibling;
        const endComment = element.nextSibling;

        // Verify comments exist
        expect(startComment?.nodeType).toBe(Node.COMMENT_NODE);
        expect(endComment?.nodeType).toBe(Node.COMMENT_NODE);

        // Unmount component
        wrapper.unmount();

        // Verify comments are removed from DOM
        expect(parent.contains(startComment)).toBe(false);
        expect(parent.contains(endComment)).toBe(false);
    });

    it('works with nested components', () => {
        process.env.NODE_ENV = 'development';

        const ChildComponent = {
            template: '<span>Child</span>',
        };

        const ParentComponent = {
            components: { ChildComponent },
            template: '<div>Parent <ChildComponent /></div>',
        };

        const wrapper = mount(ParentComponent, {
            attachTo: document.body,
            global: {
                plugins: [VueComponentDebug],
            },
        });

        // Check parent component comments (will use "Anonymous" in test environment)
        const parentElement = wrapper.element;
        expect(parentElement.previousSibling?.nodeValue).toBe(' Start component: Anonymous ');
        expect(parentElement.nextSibling?.nodeValue).toBe(' End component: Anonymous ');

        // Check child component comments
        const childElement = wrapper.findComponent(ChildComponent).element;
        expect(childElement.previousSibling?.nodeValue).toBe(' Start component: Anonymous ');
        expect(childElement.nextSibling?.nodeValue).toBe(' End component: Anonymous ');

        wrapper.unmount();
    });

    it('accepts enabled option and passes it to mixin', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            name: 'TestComponent',
            template: '<div>Test</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [[VueComponentDebug, { enabled: false }]],
            },
        });

        const element = wrapper.element;

        // Should not have comments when disabled via options
        expect(element.previousSibling).toBeNull();
        expect(element.nextSibling).toBeNull();

        wrapper.unmount();
    });

    it('can force enable in production mode via options', () => {
        process.env.NODE_ENV = 'production';

        const TestComponent = {
            name: 'TestComponent',
            template: '<div>Test</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [[VueComponentDebug, { enabled: true }]],
            },
        });

        const element = wrapper.element;

        // Should have comments even in production when explicitly enabled
        expect(element.previousSibling?.nodeType).toBe(Node.COMMENT_NODE);
        expect(element.nextSibling?.nodeType).toBe(Node.COMMENT_NODE);

        wrapper.unmount();
    });

    it('handles string "false" from environment variables', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            name: 'TestComponent',
            template: '<div>Test</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [[VueComponentDebug, { enabled: 'false' }]],
            },
        });

        const element = wrapper.element;

        // Should not have comments when disabled via string "false"
        expect(element.previousSibling).toBeNull();
        expect(element.nextSibling).toBeNull();

        wrapper.unmount();
    });

    it('handles string "true" from environment variables', () => {
        process.env.NODE_ENV = 'production';

        const TestComponent = {
            name: 'TestComponent',
            template: '<div>Test</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
            global: {
                plugins: [[VueComponentDebug, { enabled: 'true' }]],
            },
        });

        const element = wrapper.element;

        // Should have comments when enabled via string "true"
        expect(element.previousSibling?.nodeType).toBe(Node.COMMENT_NODE);
        expect(element.nextSibling?.nodeType).toBe(Node.COMMENT_NODE);

        wrapper.unmount();
    });
});
