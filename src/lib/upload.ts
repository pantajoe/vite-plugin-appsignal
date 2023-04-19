import path from 'node:path'
import fs from 'node:fs'
import type { ViteAppsignalOptions } from '../..'

const UPLOAD_URI = 'https://appsignal.com/api/sourcemaps'

export type UploadOptions = Omit<ViteAppsignalOptions, 'revision'> & {
  revision: string
  debug?: (label: string, data?: any) => unknown
}

export async function upload(sourcemapPath: string, options: UploadOptions): Promise<void> {
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
      console.error(
        `Uploading sourcemap ${sourcemapPath} failed with message '${response.statusText}' (${response.status}).\n\nResponse: ${responseBody}\n`,
      )
      throw new Error(`Uploading sourcemap ${sourcemapPath} failed with status ${response.status}.`)
    }
  } catch (error) {
    console.error(`Uploading sourcemap ${sourcemapPath} failed with error '${error.message}'.`)
    throw error
  }
}
