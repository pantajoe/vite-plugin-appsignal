import { defineConfig } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import eslint from '@rollup/plugin-eslint'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  input: 'src/index.ts',
  external: ['node:util', 'vite', 'fast-glob', 'retry', 'node:path', 'node:fs', 'node:child_process'],
  output: [
    {
      format: 'es',
      file: 'dist/index.js',
      sourcemap: true,
      exports: 'auto',
    },
    {
      format: 'cjs',
      file: 'dist/index.cjs',
      sourcemap: true,
      exports: 'auto',
    },
  ],
  plugins: [eslint(), typescript(), commonjs()],
})
