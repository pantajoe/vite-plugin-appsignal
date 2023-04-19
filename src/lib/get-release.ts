import { exec } from 'node:child_process'

interface Options {
  revision?: string
}

function getReleaseFromGit(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --short HEAD', (error, stdout) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

/**
 * Get revision version, either from config or from git.
 */
export async function getRelease(options: Options = {}) {
  try {
    const version = await (options.revision ? Promise.resolve(options.revision) : getReleaseFromGit())
    return `${version}`.trim()
  } catch {
    return undefined
  }
}
