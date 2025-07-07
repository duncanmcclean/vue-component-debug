import { createComponentDebugMixin } from './mixins/componentDebug.js';

export { createComponentDebugMixin };

export default {
    install(app = {}, options = {}) {
        const debugMixin = createComponentDebugMixin(options);
        app.mixin(debugMixin);
    },
};
