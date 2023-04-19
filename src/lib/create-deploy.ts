import type { ViteAppsignalPluginOptions } from '../..'
import { debugLogger } from './debug-logger'
import { pRetry } from './retry'

const APP_ID = '[[app-id]]'
const API_TOKEN = '[[api-token]]'
const APPSIGNAL_DEPLOY_URL = `https://appsignal.com/api/${APP_ID}/markers.json?token=${API_TOKEN}`

type Options = Omit<ViteAppsignalPluginOptions, 'revision' | 'skipEnvironmentCheck'> & {
  revision: string
}

async function createDeployMarker(opts: Options) {
  const { appId, revision, debug: debugActive, personalApiToken: apiToken } = opts
  const debug = debugActive ? debugLogger : undefined

  const url = APPSIGNAL_DEPLOY_URL.replace(APP_ID, appId).replace(API_TOKEN, apiToken)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'deploy',
        revision,
      }),
    })

    if (response.ok) {
      debug?.('Created deploy marker successfully', { revision })
    } else {
      const responseBody = await response.text()
      const err = `Creating deploy marker ${revision} failed with message '${response.statusText}' (${response.status}): ${responseBody}`
      debug?.(err)
      throw new Error(err)
    }
  } catch (error) {
    debug?.(`Creating deploy marker ${revision} failed with error '${error.message}'.`)
    throw error
  }
}

/**
 * Creates a deploy marker in Appsignal.
 */
export function createDeploy(opts: Options) {
  return pRetry(() => createDeployMarker(opts), {
    retries: 3,
    minTimeout: 500,
    maxTimeout: 2000,
  })
}
