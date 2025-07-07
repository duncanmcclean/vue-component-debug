import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'VueComponentDebug',
            formats: ['es', 'umd'],
            fileName: (format) => `vue-component-debug.${format === 'es' ? 'js' : 'umd.cjs'}`,
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                exports: 'named',
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
    },
});
