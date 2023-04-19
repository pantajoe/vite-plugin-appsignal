import { defineConfig } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import eslint from '@rollup/plugin-eslint'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default defineConfig({
  input: 'src/index.ts',
  external: ['node:util', 'vite', 'fast-glob', 'retry', 'node:path', 'node:fs', 'node:child_process'],
  output: [
    {
      format: 'es',
      file: pkg.module,
      sourcemap: true,
      exports: 'auto',
    },
    {
      format: 'cjs',
      file: pkg.main,
      sourcemap: true,
      exports: 'auto',
    },
  ],
  plugins: [eslint(), typescript(), commonjs()],
})
