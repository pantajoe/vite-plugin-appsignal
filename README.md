# Plugin to integrate Vite ⚡️ with Appsignal Sourcemap API

![Version](https://img.shields.io/npm/v/vite-plugin-appsignal)![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

> Vite plugin acts as interface to [Appsignal Sourcemap API](https://docs.appsignal.com/api/sourcemaps.html)

It's a port of the [`vite-plugin-sentry`](https://github.com/ikenfin/vite-plugin-sentry) for Vite and therefore heavily inspired by it.

## Install

```bash
yarn add -D vite-plugin-appsignal
```

## Configuration

If you using Typescript - you can use **ViteAppsignalPluginOptions** type for better configuration experience with autocomplete.

Example config:

```typescript
// vite.config.ts
// other declarations
import type { ViteAppsignalPluginOptions } from 'vite-plugin-appsignal'
import Appsignal from 'vite-plugin-appsignal'

/*
  Configure appsignal plugin
*/
const appsignalConfig: ViteAppsignalPluginOptions = {
  appName: 'my_app_backend',
  pushApiKey: '<APPSIGNAL_PUSH_API_KEY>',
  revision: '1.0',
  env: 'production',
  urlPrefix: 'https://my-app.com/assets',
  sourceMaps: {
    include: ['./dist/assets'],
    ignore: ['node_modules'],
  },
}

export default defineConfig({
  // other options
  plugins: [Appsignal(appsignalConfig)],
  build: {
    // required: tells vite to create source maps
    sourcemap: true,
  }
})
```

## Share config with Appsignal client library

To correctly work with Appsignal, you need to add a **revision** to your project.

You can expose the revision used by `vite-plugin-appsignal` into your application using thge Vite feature of "virtual modules".

To do so, you need to add some lines of code:

```javascript
// import virtual module
// i would recommend doing it at entry point script (e.g. main.js)
import 'virtual:vite-plugin-appsignal/appsignal-config'
import Appsignal from '@appsignal/javascript'

// now you can use this variable like so
const { revision, apiKey: key } = import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG;

// use it in appsignal init
new Appsignal({
  // other appsignal options
  revision,
  key,
})

// also, these settings exposed to globalThis object
// so you can get them from window object:
const revision = window.VITE_PLUGIN_APPSIGNAL_CONFIG.revision
```

## TypeScript

To get type information for the virtual module or import meta env, you can add `vite-plugin-appsignal/client` to your `types` array in tsconfig.json.

```javascript
{
  "types": [
    "vite-plugin-appsignal/client"
  ]
}
```

Also you can use `reference` in your typescript code like below:

```javascript
///<reference types="vite-plugin-appsignal/client"/>
```

## FAQ

### Delete generated source maps after upload

There are no built-in options to clean sourcemaps.

While i recommend to use CI, you can also use tools like rimraf in your npm scripts to drop any unnecessary files after build was complete:

```javascript
// package.json
{
  "scripts": {
    // delete all js map files when built
    "build": "vite build && rimraf dist/**/*.js.map"
  }
}
```

## List of available options

Here are the list of all plugin options:

**Legend:**

❌ - NOT required

⚠️ - NOT required in plugin config, but MUST be set (for example, using [.appsignalclirc](https://docs.appsignal.io/product/cli/configuration/#configuration-file) file)

✅ - Required

| Option               | Type                                  | Required | Default value  | Description                                                                                                                                                                                                     |
| -------------------- | ------------------------------------- | -------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| debug                | `boolean`                             | ❌        | `false`        | Show debug messages during run                                                                                                                                                                                  |
| skipEnvironmentCheck | `boolean`                             | ❌        | `false`        | By default plugin will be enabled only for production builds. Set this option to `true` to skip environment checks                                                                                              |
| pushApiKey           | `string`                              | ⚠️        |                | The authentication token to use for all communication with Appsignal.                                                                                                                                           |
| appName              | `string`                              | ⚠️        |                | The slug of the Appsignal project associated with the app.                                                                                                                                                      |
| revision             | `string`                              | ❌        |                | Unique name for revision. Defaults to short commit SHA from git (requires access to GIT and root directory to be repo)                                                                                          |
| env                  | `string`                              | ❌        | `'production'` | Environment value for build                                                                                                                                                                                     |
| urlPrefix            | `string`                              | ✅        |                | URL prefix to add to the beginning of all filenames. You might want to set this to the full URL. This is also useful if your files are stored in a sub folder. eg: `url-prefix 'https://my-app.com/static/js'`. |
| sourceMaps           | `AppsignalCliUploadSourceMapsOptions` | ✅        |                | Sourcemaps settings, see details below                                                                                                                                                                          |

### `sourceMaps` settings

With `sourceMaps` you can configure how sourcemaps will be processed

| Option  | Type                    | Required | Description                                                                                                                                             |
| ------- | ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| include | `string    \| string[]` | ✅        | One or more paths that Appsignal CLI should scan recursively for sources. It will upload all `.map` files and match associated `.js` files.             |
| ignore  | `string[]`              | ❌        | Paths to ignore during upload. Overrides entries in `ignoreFile` file. If neither `ignoreFile` nor `ignore` is present, defaults to `['node_modules']`. |

## Testing

This repo uses `jest` for unit-testing. Run `yarn test` to run all tests.

## Author

👤 **pantajoe**

* Website: [https://joepantazidis.me](https://joepantazidis.me)
* Github: [@pantajoe](https://github.com/pantajoe)
