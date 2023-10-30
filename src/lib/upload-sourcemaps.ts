import path from 'node:path'
import fs from 'node:fs'
import glob from 'fast-glob'
import type { ViteAppsignalOptions, ViteAppsignalPluginOptions } from '../..'
import { debugLogger } from './debug-logger'
import { chunkify } from './util'
import { pRetry } from './retry'

const UPLOAD_URI = 'https://appsignal.com/api/sourcemaps'

export type UploadOptions = Omit<ViteAppsignalOptions, 'revision'> & {
  revision: string
  debug?: (label: string, data?: any) => unknown
}

async function upload(sourcemapPath: string, options: UploadOptions): Promise<void> {
  const { appName, pushApiKey, revision, env = 'production', urlPrefix = '~/', debug } = options
  debug?.('Starting sourcemap upload', sourcemapPath)

  const jsFileName = sourcemapPath
    .split(path.sep)
    .pop()!
    .replace(/\.map$/, '')
  const jsFileUrl = `${urlPrefix.replace(/\/$/, '')}/${jsFileName}`
  const file = fs.readFileSync(sourcemapPath)

  try {
    const body = new FormData()
    body.append('push_api_key', pushApiKey)
    body.append('app_name', appName)
    body.append('revision', revision)
    body.append('environment', env)
    body.append('name[]', jsFileUrl)
    // @ts-expect-error FormData.append() does not accept a Buffer as second argument
    body.append('file', file)

    const response = await fetch(UPLOAD_URI, {
      method: 'POST',
      body,
    })
    if (response.ok) {
      debug?.('Finished sourcemap upload', { sourcemap: sourcemapPath, body: Object.fromEntries(body.entries()) })
    } else {
      const responseBody = await response.text()
      const err = `Uploading sourcemap ${sourcemapPath} failed with message '${response.statusText}' (${response.status}): ${responseBody}`
      debug?.(err)
      throw new Error(err)
    }
  } catch (error) {
    debug?.(`Uploading sourcemap ${sourcemapPath} failed with error '${error.message}'.`)
    throw error
  }
}

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

type Options = Omit<UploadOptions, 'debug'> & Omit<ViteAppsignalPluginOptions, 'revision' | 'skipEnvironmentCheck'>
export async function uploadSourcemaps(opts: Options) {
  const { sourceMaps, debug = false, ...options } = opts
  const logger = debug ? debugLogger : undefined

  const { include, exclude } = sourceMaps
  const sourcemapPaths = findSourcemapPaths({ include, exclude, debug: logger })
  if (sourcemapPaths.length === 0) {
    console.warn?.('No sourcemaps found, skipping upload')
    return
  }

  await Promise.all(
    chunkify(sourcemapPaths, 10).map(async (batch) => {
      await Promise.all(
        batch.map((sourcemapPath) =>
          pRetry(() => upload(sourcemapPath, { ...options, debug: logger }), {
            retries: 5,
            minTimeout: 500,
            maxTimeout: 2_000,
          }),
        ),
      )
    }),
  )
}
