/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Config options that can be passed to client from vite config
   */
  readonly VITE_PLUGIN_APPSIGNAL_CONFIG: {
    release?: string
  }
}

declare module 'virtual:vite-plugin-appsignal/appsignal-config' {
  export {}
}
