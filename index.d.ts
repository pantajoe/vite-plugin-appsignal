import type { Plugin } from 'vite'

export interface ViteAppsignalPluginOptionsSourceMapsOptions {
  /**
   * Paths to search for source maps.
   */
  include: string[]

  /**
   * Paths to exclude from source maps search.
   */
  exclude?: string[]
}

export interface ViteAppsignalOptions {
  /**
   * Organization-wide token for Appsignal API.
   */
  pushApiKey: string

  /**
   * Frontend-monitoring API Key for this specific app and environment.
   * This will be injected into the app as `import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG.apiKey`.
   */
  apiKey?: string

  /**
   * App ID for this specific app and environment.
   * Is visible in the URL when you open the app in Appsignal (directly after the `/sites/` part).
   */
  appId: string

  /**
   * Personal API Token for Appsignal API. Can be obtained at https://appsignal.com/users/edit.
   */
  personalApiToken: string


  /**
   * Name of the application, i.e. "myapp"
   */
  appName: string

  /**
   * Unique name of the revision.
   * Defaults to latest git commit SHA (requires access to GIT and root directory to be repo).
   */
  revision?: string

  /**
   * Environment name, i.e. "production"
   *
   * @default "development"
   */
  env?: string

  /**
   * URL prefix to add to the beginning of all filenames.
   * Defaults to `'~/'` but you might want to set this to the full URL.
   * This is also useful if your files are stored in a sub folder, eg: `'~/static/js'`.
   *
   * @default '~/'
   */
  urlPrefix?: string

  /**
   * List of URL prefixes to add to the beginning of all filenames, cloud be used instead of a single `urlPrefix`.
   * Defaults to an array with a `urlPrefix` as single entry.
   */
  urlPrefixes?: string[]
}

/**
 * Plugin input options
 */
export interface ViteAppsignalPluginOptions extends ViteAppsignalOptions  {

  /**
   * Show debug messages during run.
   */
  debug?: boolean

  /**
   * Force enable sourcemap upload.
   */
  skipEnvironmentCheck?: boolean

  /**
   * Source maps settings
   */
  sourceMaps: ViteAppsignalPluginOptionsSourceMapsOptions
}

/*
  Vite plugin function declaration
*/
export default function (options: ViteAppsignalPluginOptions): Plugin
