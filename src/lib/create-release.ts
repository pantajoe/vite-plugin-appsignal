import path from 'node:path'
import glob from 'glob'
import type { ViteAppsignalPluginOptions } from '../..'
import { debugLogger } from './debug-logger'
import type { UploadOptions } from './upload'
import { upload } from './upload'

type FindSourcemapPathsOptions = ViteAppsignalPluginOptions['sourceMaps'] & Pick<UploadOptions, 'debug'>
function findSourcemapPaths(opts: FindSourcemapPathsOptions) {
  const { include, exclude, debug } = opts

  // use cwd and join all include paths and find by glob pattern
  const cwd = process.cwd()
  const globs = include.map((p) => `${path.join(cwd, p)}/**/*.map`)
  debug?.(`Searching for sourcemaps in ${globs.join(', ')}`)
  const paths = globs.flatMap((pattern) => glob.sync(pattern, { ignore: exclude }))
  debug?.(`Found sourcemaps: ${paths.length}`)
  return paths
}

type Options = Omit<UploadOptions, 'debug'> & Omit<ViteAppsignalPluginOptions, 'release' | 'skipEnvironmentCheck'>
export async function createRelease(opts: Options) {
  const { sourceMaps, debug = false, ...options } = opts
  const logger = debug ? debugLogger : undefined

  const { include, exclude } = sourceMaps
  const sourcemapPaths = findSourcemapPaths({ include, exclude, debug: logger })
  if (sourcemapPaths.length === 0) {
    console.error?.('No sourcemaps found, skipping upload')
    return
  }

  await Promise.all(sourcemapPaths.map((sourcemapPath) => upload(sourcemapPath, { ...options, debug: logger })))
}
