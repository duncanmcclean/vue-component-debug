import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createComponentDebugMixin } from '../src/mixins/componentDebug.js';

describe('createComponentDebugMixin', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('creates a mixin with mounted and beforeUnmount hooks', () => {
        const mixin = createComponentDebugMixin();

        expect(mixin).toHaveProperty('mounted');
        expect(mixin).toHaveProperty('beforeUnmount');
        expect(typeof mixin.mounted).toBe('function');
        expect(typeof mixin.beforeUnmount).toBe('function');
    });

    it('adds HTML comments around component in development mode', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            name: 'TestComponent',
            __file: 'src/components/TestComponent.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
        });

        const element = wrapper.element;
        const parent = element.parentNode;

        // Check for start comment
        const prevSibling = element.previousSibling;
        expect(prevSibling).toBeTruthy();
        expect(prevSibling.nodeType).toBe(Node.COMMENT_NODE);
        expect(prevSibling.nodeValue).toBe(' Start component: src/components/TestComponent.vue ');

        // Check for end comment
        const nextSibling = element.nextSibling;
        expect(nextSibling).toBeTruthy();
        expect(nextSibling.nodeType).toBe(Node.COMMENT_NODE);
        expect(nextSibling.nodeValue).toBe(' End component: src/components/TestComponent.vue ');

        wrapper.unmount();
    });

    it('uses component name when __file is not available', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            __name: 'MyComponent',
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
        });

        const element = wrapper.element;
        const prevSibling = element.previousSibling;

        expect(prevSibling.nodeValue).toBe(' Start component: MyComponent ');

        wrapper.unmount();
    });

    it('uses "Anonymous" when no component identifier is available', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
        });

        const element = wrapper.element;
        const prevSibling = element.previousSibling;

        expect(prevSibling.nodeValue).toBe(' Start component: Anonymous ');

        wrapper.unmount();
    });

    it('does not add comments in production mode', () => {
        process.env.NODE_ENV = 'production';

        const TestComponent = {
            name: 'TestComponent',
            __file: 'src/components/TestComponent.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
        });

        const element = wrapper.element;

        // Should not have comment siblings in production
        expect(element.previousSibling).toBeNull();
        expect(element.nextSibling).toBeNull();

        wrapper.unmount();
    });

    it('cleans up comments when component is unmounted', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            name: 'TestComponent',
            __file: 'src/components/TestComponent.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        const wrapper = mount(TestComponent, {
            attachTo: document.body,
        });

        const element = wrapper.element;
        const parent = element.parentNode;

        // Verify comments exist
        expect(element.previousSibling?.nodeType).toBe(Node.COMMENT_NODE);
        expect(element.nextSibling?.nodeType).toBe(Node.COMMENT_NODE);

        // Store references to comments
        const startComment = element.previousSibling;
        const endComment = element.nextSibling;

        // Unmount component
        wrapper.unmount();

        // Verify comments are removed from DOM
        expect(parent.contains(startComment)).toBe(false);
        expect(parent.contains(endComment)).toBe(false);
    });

    it('handles multiple components with different names', () => {
        process.env.NODE_ENV = 'development';

        const Component1 = {
            __file: 'src/components/Component1.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Component 1</div>',
        };

        const Component2 = {
            __file: 'src/components/Component2.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Component 2</div>',
        };

        const wrapper1 = mount(Component1, { attachTo: document.body });
        const wrapper2 = mount(Component2, { attachTo: document.body });

        expect(wrapper1.element.previousSibling.nodeValue).toBe(' Start component: src/components/Component1.vue ');
        expect(wrapper2.element.previousSibling.nodeValue).toBe(' Start component: src/components/Component2.vue ');

        wrapper1.unmount();
        wrapper2.unmount();
    });

    it('handles components without parent nodes gracefully', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            __file: 'src/components/TestComponent.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        // Mount without attaching to document
        const wrapper = mount(TestComponent);

        // Should not throw errors when parent is null
        expect(() => {
            wrapper.unmount();
        }).not.toThrow();
    });

    it('only removes matching comments during cleanup', () => {
        process.env.NODE_ENV = 'development';

        const TestComponent = {
            __file: 'src/components/TestComponent.vue',
            mixins: [createComponentDebugMixin()],
            template: '<div>Test Content</div>',
        };

        const container = document.createElement('div');
        document.body.appendChild(container);

        // Add some unrelated comments
        const unrelatedComment1 = document.createComment(' Some other comment ');
        const unrelatedComment2 = document.createComment(' Another comment ');
        container.appendChild(unrelatedComment1);
        container.appendChild(unrelatedComment2);

        const wrapper = mount(TestComponent, {
            attachTo: container,
        });

        // Verify our component comments exist
        const element = wrapper.element;
        expect(element.previousSibling.nodeValue).toBe(' Start component: src/components/TestComponent.vue ');
        expect(element.nextSibling.nodeValue).toBe(' End component: src/components/TestComponent.vue ');

        wrapper.unmount();

        // Unrelated comments should still exist
        expect(container.contains(unrelatedComment1)).toBe(true);
        expect(container.contains(unrelatedComment2)).toBe(true);

        document.body.removeChild(container);
    });
});
