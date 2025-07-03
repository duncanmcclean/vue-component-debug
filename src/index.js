import { createComponentDebugMixin } from './mixins/componentDebug.js';

export { createComponentDebugMixin };

export default {
    install(app = {}) {
        const debugMixin = createComponentDebugMixin();
        app.mixin(debugMixin);
    },
};
