import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import strip from '@rollup/plugin-strip'
import envCompatible from 'vite-plugin-env-compatible'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
    plugins: [
        strip({
            functions: ['eval']
        }),
        dts({
            entryRoot: './src'
        }),
        envCompatible(),
        nodePolyfills()
    ],
    build: {
        minify: true,
        sourcemap: true,
        lib: {
            formats: ['es', 'umd'],
            entry: './src/Web3Wallets.ts',
            name: 'MultipleChain.AppKit',
            fileName: (format: string) => `index.${format}.js`
        }
    },
    server: {
        watch: {
            usePolling: true,
            interval: 1000
        },
        port: 3000,
        host: true,
        strictPort: true
    }
})
