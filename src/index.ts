import type { Plugin } from 'vite'
import type { ViteAppsignalPluginOptions } from '..'
import { getRevision } from './lib/get-revision'
import { createDeploy } from './lib/create-deploy'
import { uploadSourcemaps } from './lib/upload-sourcemaps'

const MODULE_ID = 'virtual:vite-plugin-appsignal/appsignal-config'
const RESOLVED_ID = `\0${MODULE_ID}`

export default function ViteAppsignal(options: ViteAppsignalPluginOptions) {
  const { skipEnvironmentCheck = false } = options

  const currentRevisionPromise = getRevision(options)

  // plugin state
  const pluginState = {
    enabled: false,
    sourcemapsCreated: false,
    isProduction: false,
  }

  const viteAppsignalPlugin: Plugin = {
    name: 'appsignal',
    enforce: 'post',
    apply(config) {
      if (config.build?.ssr) return false
      return true
    },

    /**
     * Define revision and apiKey in `import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG`
     */
    async config() {
      const currentRevision = await currentRevisionPromise

      return {
        define: {
          'import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG': JSON.stringify({
            revision: currentRevision,
            apiKey: options.apiKey,
          }),
        },
      }
    },

    /**
     * Check incoming config and decise - enable plugin or not.
     * We don't want enable plugin for non-production environments.
     * Also we dont't want to enable with disabled sourcemaps
     */
    configResolved(config) {
      pluginState.sourcemapsCreated = !!config.build.sourcemap
      pluginState.isProduction = config.isProduction
      pluginState.enabled = pluginState.sourcemapsCreated && (skipEnvironmentCheck || config.isProduction)
    },

    /**
     * Resolve id for virtual module
     */
    resolveId(id) {
      if (id === MODULE_ID) {
        return RESOLVED_ID
      }
    },

    /**
     * Provide virtual module.
     */
    load(id) {
      if (id === RESOLVED_ID) {
        return 'globalThis.VITE_PLUGIN_APPSIGNAL_CONFIG = import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG\n'
      }
    },

    /**
     * We starting plugin here, because at the moment vite completed with building,
     * so sourcemaps must be ready.
     */
    async closeBundle() {
      const { enabled, sourcemapsCreated, isProduction } = pluginState

      if (!enabled) {
        if (!isProduction) {
          this.warn(
            'Skipped because running non-production build. If you want to run it anyway set skipEnvironmentCheck option value to true',
          )
        } else if (!sourcemapsCreated) {
          this.warn(
            'Skipped because vite is not configured to provide sourcemaps. Please check configuration setting [options.sourcemap]!',
          )
        }
      } else {
        if (!isProduction && skipEnvironmentCheck) {
          this.warn('Running in non-production mode!')
        }

        const currentRelease = await currentRevisionPromise

        if (!currentRelease) {
          this.error('Revision returned from git is empty! Please check your config')
        } else {
          try {
            // create new options object with a definitely present revision
            const opts = { ...options, revision: currentRelease }

            // create deploy
            await createDeploy(opts)

            // upload sourcemaps
            await uploadSourcemaps(opts)
          } catch (error) {
            this.error(`Error while uploading sourcemaps to Appsignal: ${error.message}`)
          }
        }
      }
    },
  }

  return viteAppsignalPlugin
}
