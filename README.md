# Plugin to integrate Vite ⚡️ with Appsignal

![Version](https://img.shields.io/npm/v/vite-plugin-appsignal)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)[![codecov](https://codecov.io/gh/pantajoe/vite-plugin-appsignal/branch/main/graph/badge.svg?token=RAM0TAVIIQ)](https://codecov.io/gh/pantajoe/vite-plugin-appsignal)

> Vite plugin acts as interface to AppsignalCLI

It's a port of official [Appsignal webpack plugin](https://github.com/getappsignal/appsignal-webpack-plugin) for Vite.

It's fully written on Typescript and there is some differences in configuration, described below, but we mostly follow [@appsignal/cli](https://github.com/getappsignal/appsignal-cli) types.

## Install

```sh
yarn add -D vite-plugin-appsignal
```

## Configuration

If you using Typescript - you can use **ViteAppsignalPluginOptions** type for better configuration experience with autocomplete.

Example config:

```typescript
// vite.config.ts
// other declarations
import type { ViteAppsignalPluginOptions } from 'vite-plugin-appsignal'
import viteAppsignal from 'vite-plugin-appsignal'

/*
  Configure appsignal plugin
*/
const appsignalConfig: ViteAppsignalPluginOptions = {
  url: 'https://appsignal.io',
  authToken: '<SECRET_TOKEN_HERE>',
  org: 'my_org',
  project: 'my_project',
  release: '1.0',
  // legacyErrorHandlingMode: true, <- warn about appsignal errors instead of fail
  deploy: {
    env: 'production'
  },
  setCommits: {
    auto: true
  },
  sourceMaps: {
    include: ['./dist/assets'],
    ignore: ['node_modules'],
    urlPrefix: '~/assets'
  }
}

export default defineConfig({
  // other options
  plugins: [ viteAppsignal(appsignalConfig) ],
  build: {
    // required: tells vite to create source maps
    sourcemap: true,
  }
})
```

#### Possible breaking change!

From version `1.2.0` we have changed default error handling. Now if Appsignal report error while uploading sourcemaps - we crash whole build process instead of just print warning. This was done to prevent calling next to `&&` operator on uploading error.

You can enable legacy mode using `legacyErrorHandlingMode: true` in plugin config.

## Wiki

Check project [wiki on github](https://github.com/pantajoe/vite-plugin-appsignal/wiki) to get more information.

## Share config with Appsignal client library

To correctly work with Appsignal, you need to add a **release** to your project. Same about **dist** option: your uploaded sourcemaps and client appsignal initialization must have same release/dist to make appsignal correct recognize and bind sourcemaps to logged errors.

You can expose release and dist options used by vite-plugin-appsignal into your application using Vite feature known as virtual module.

To do so, you need to add several lines:

```javascript
// import virtual module
// i would recommend doing it at entry point script (e.g. main.js)
import 'virtual:vite-plugin-appsignal/appsignal-config'

// now you can use this variable like so
const dist = import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG.dist
const release = import.meta.env.VITE_PLUGIN_APPSIGNAL_CONFIG.release

// use it in appsignal init
Appsignal.init({
  // other appsignal options
  dist,
  release
})

// also, these settings exposed to globalThis object
// so you can get them from window object:
const dist = window.VITE_PLUGIN_APPSIGNAL_CONFIG.dist
const release = window.VITE_PLUGIN_APPSIGNAL_CONFIG.release
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

## Common how to:

#### Delete generated source maps after upload (#1)

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

#### Cannot install on Windows

This plugin relies on @appsignal/cli tool, which requires VCRedist to be installed. Please check [#8](https://github.com/pantajoe/vite-plugin-appsignal/issues/8) for details.

## List of available options

Here are the list of all plugin options:

**Legend:**

❌ - NOT required

⚠️ - NOT required in plugin config, but MUST be set (for example, using [.appsignalclirc](https://docs.appsignal.io/product/cli/configuration/#configuration-file) file)

✅ - Required

| Option                  | Type                             | Required | Default value        | Description                                                                                                                                                                                                                                               |
| ----------------------- | -------------------------------- | -------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| legacyErrorHandlingMode | boolean                          | ❌       | false                | When `true` - all appsignal uploading errors will be printed as warnings, build process will not be failed, vite will return exit code 0 |
| debug                   | boolean                          | ❌       | false                | Show debug messages during run                                                                                                                                                                                                                            |
| skipEnvironmentCheck    | boolean                          | ❌       | false                | By default plugin will be enabled only for production builds. Set this option to `true` to skip environment checks                                                                                                                                      |
| dryRun                  | boolean                          | ❌       | false                | Run appsignal in dry mode - will only prints all steps                                                                                                                                                                                                       |
| url                     | string                           | ❌       | 'https://appsignal.io/' | The base URL of your Appsignal instance.                                                                                                                                                                                                                     |
| authToken               | string                           | ⚠️     | ''                   | The authentication token to use for all communication with Appsignal. Can be obtained from https://appsignal.io/settings/account/api/auth-tokens/. Required scopes:`project:releases` (and `org:read` if `setCommits` option is used).                    |
| org                     | string                           | ⚠️     | ''                   | The slug of the Appsignal organization associated with the app.                                                                                                                                                                                              |
| project                 | string                           | ⚠️     | ''                   | The slug of the Appsignal project associated with the app.                                                                                                                                                                                                   |
| vcsRemote               | string                           | ❌       | 'origin'             | The name of the remote in the version control system.                                                                                                                                                                                                     |
| configFile              | string                           | ❌       | ''                   | Path to appsignal cli config file, as described in https://docs.appsignal.io/product/cli/configuration/#configuration-file. By default, the config file is looked for upwards from the current path, and defaults from `~/.appsignalclirc` are always loaded     |
| release                 | string                           | ❌       |                      | Unique name for release. Defaults to appsignal-cli releases propose version (requires access to GIT and root directory to be repo)                                                                                                                           |
| finalize                | boolean                          | ❌       | false                | Determines whether processed release should be automatically finalized after artifacts upload                                                                                                                                                             |
| silent                  | boolean                          | ❌       | false                | If true, all appsignal-cli logs are suppressed                                                                                                                                                                                                               |
| deploy                  | AppsignalCliNewDeployOptions        | ❌       |                      | Appsignal release deployment settings, see details below                                                                                                                                                                                                     |
| sourceMaps              | AppsignalCliUploadSourceMapsOptions | ✅       |                      | Sourcemaps settings, see details below                                                                                                                                                                                                                    |
| setCommits              | AppsignalCliCommitsOptions          | ❌       |                      | Adds commits to appsignal, see details below                                                                                                                                                                                                                 |

#### deploy settings

With `deploy` you can configure appsignal cli to send deployment info. Here is a table of settings:

| Option   | Type   | Required | Description                                                                          |
| -------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| env      | string | ✅       | Environment value for release. For example `production`                            |
| started  | number | ❌       | UNIX timestamp for deployment start                                                  |
| finished | number | ❌       | UNIX timestamp for deployment finish                                                 |
| time     | number | ❌       | Deployment duration in seconds. Can be used instead of `started` and `finished`. |
| name     | string | ❌       | Human-readable name for this deployment                                              |
| url      | string | ❌       | URL that points to the deployment                                                    |

#### sourceMaps settings

With `sourceMaps` you can configure how sourcemaps will be processed

| Option             | Type              | Required | Description                                                                                                                                                                                                                                           |
| ------------------ | ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| include            | string\| string[] | ✅       | One or more paths that Appsignal CLI should scan recursively for sources. It will upload all `.map` files and match associated `.js` files.                                                                                                          |
| dist               | string            | ❌       | Unique identifier for the distribution, used to further segment your release. Usually your build number                                                                                                                                               |
| ignore             | string[]          | ❌       | Paths to ignore during upload. Overrides entries in `ignoreFile` file. If neither `ignoreFile` nor `ignore` is present, defaults to `['node_modules']`.                                                                                       |
| ignoreFile         | string            | ❌       | Path to a file containing list of files/directories to ignore. Can point to `.gitignore` or anything with the same format.                                                                                                                          |
| rewrite            | boolean           | ❌       | Enables rewriting of matching source maps so that indexed maps are flattened and missing sources are inlined if possible. Defaults to `true`                                                                                                        |
| sourceMapReference | boolean           | ❌       | Prevents the automatic detection of sourcemap references. Defaults to `false`.                                                                                                                                                                      |
| stripPrefix        | string[]          | ❌       | When paired with `rewrite`, will remove a prefix from uploaded filenames. Useful for removing a path that is build-machine-specific.                                                                                                                |
| stripCommonPrefix  | boolean           | ❌       | When paired with `rewrite`, will add `~` to the `stripPrefix` array. Defaults to `false`                                                                                                                                                      |
| validate           | boolean           | ❌       | When `true`, attempts source map validation before upload if rewriting is not enabled. It will spot a variety of issues with source maps and cancel the upload if any are found. Defaults to `false` to prevent false positives canceling upload. |
| urlPrefix          | string            | ❌       | URL prefix to add to the beginning of all filenames. Defaults to `~/` but you might want to set this to the full URL. This is also useful if your files are stored in a sub folder. eg: `url-prefix '~/static/js'`.                               |
| urlSuffix          | string            | ❌       | URL suffix to add to the end of all filenames. Useful for appending query parameters.                                                                                                                                                                 |
| ext                | string[]          | ❌       | The file extensions to be considered. By default the following file extensions are processed:`js`, `map`, `jsbundle`, and `bundle`.                                                                                                           |

#### setCommits settings

With `setCommits` you can configure

| Option         | Type    | Required                | Description                                                                                                                                                                                                               |
| -------------- | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| repo           | string  | ✅`if auto === false` | The full git repo name as defined in Appsignal. Required if `auto` option is not `true`, otherwise optional.                                                                                                             |
| commit         | string  | ✅`if auto === false` | The current (most recent) commit in the release. Required if `auto` option is not `true`, otherwise optional.                                                                                                         |
| previousCommit | string  | ❌                      | The last commit of the previous release. Defaults to the most recent commit of the previous release in Appsignal, or if no previous release is found, 10 commits back from `commit`.                                       |
| auto           | boolean | ❌                      | Automatically set `commit` and `previousCommit`. Defaults `commit` to `HEAD` and `previousCommit` as described above. Overrides other options                                                                   |
| ignoreMissing  | boolean | ❌                      | When the flag is set and the previous release commit was not found in the repository, will create a release with the default commits count(or the one specified with `--initial-depth`) instead of failing the command. |
| ignoreEmpty    | boolean | ❌                      | When the flag is set, command will not fail and just exit silently if no new commits for a given release have been found.                                                                                                 |

## Tests

At the moment we got unit tests for plugin functions. You can run them by running `yarn test`

Also there will appear e2e tests soon.

## Author

👤 **pantajoe**

* Website: https://ikfi.ru
* Github: [@pantajoe](https://github.com/pantajoe)

## Thanks

Thank you to all contributors and users of this plugin. Knowing that so many people found this plugin helpful is really motivating me!

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
