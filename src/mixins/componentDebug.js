export function createComponentDebugMixin(options = {}) {
    const { enabled = process.env.NODE_ENV === 'development' } = options;

    // Handle string values from environment variables
    const isEnabled = typeof enabled === 'string' ? enabled.toLowerCase() === 'true' : Boolean(enabled);

    return {
        mounted() {
            if (!isEnabled) {
                return;
            }

            const component = this.$options.__file || this.$options.__name || 'Anonymous';

            const startComment = document.createComment(` Start component: ${component} `);
            this.$el.parentNode?.insertBefore(startComment, this.$el);

            const endComment = document.createComment(` End component: ${component} `);
            this.$el.parentNode?.insertBefore(endComment, this.$el.nextSibling);
        },
        beforeUnmount() {
            if (!isEnabled) {
                return;
            }

            // Clean up comments when components are destroyed.
            const component = this.$options.__file || this.$options.__name || 'Anonymous';
            const parent = this.$el.parentNode;

            if (parent) {
                let node = this.$el.previousSibling;
                while (node && node.nodeType === Node.COMMENT_NODE) {
                    if (node.nodeValue === ` Start component: ${component} `) {
                        parent.removeChild(node);
                        break;
                    }
                    node = node.previousSibling;
                }

                node = this.$el.nextSibling;
                while (node && node.nodeType === Node.COMMENT_NODE) {
                    if (node.nodeValue === ` End component: ${component} `) {
                        parent.removeChild(node);
                        break;
                    }
                    node = node.nextSibling;
                }
            }
        },
    };
}
