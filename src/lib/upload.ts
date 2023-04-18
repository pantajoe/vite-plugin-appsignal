import path from 'node:path'
import fs from 'node:fs'
import fetch, { FormData } from 'node-fetch'
import type { ViteAppsignalOptions } from '../..'

const UPLOAD_URI = new URL('https://appsignal.com/api/sourcemaps')

export type UploadOptions = Omit<ViteAppsignalOptions, 'release'> & {
  release: string
  debug?: (label: string, data?: any) => unknown
}

export async function upload(sourcemapPath: string, options: UploadOptions): Promise<void> {
  const { appName, pushApiKey, release, env = 'production', urlPrefix = '~/', debug } = options
  debug?.('Starting sourcemap upload', sourcemapPath)

  const jsFileName = sourcemapPath
    .split(path.sep)
    .pop()!
    .replace(/\.map$/, '')
  const jsFileUrl = `${urlPrefix.replace(/\/$/, '')}/${jsFileName}`
  const binary = fs.createReadStream(sourcemapPath)

  try {
    const body = new FormData()
    body.append('push_api_key', pushApiKey)
    body.append('app_name', appName)
    body.append('release', release)
    body.append('environment', env)
    body.append('name[]', jsFileUrl)
    body.append('file', binary as any)

    const response = await fetch(UPLOAD_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body,
    })
    if (response.ok) {
      debug?.('Finished sourcemap upload', sourcemapPath)
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
