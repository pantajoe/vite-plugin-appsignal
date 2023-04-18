import { exec } from 'node:child_process'

interface Options {
  release?: string
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
 * Get release version, either from config or from git.
 */
export async function getRelease(options: Options = {}) {
  try {
    const version = await (options.release ? Promise.resolve(options.release) : getReleaseFromGit())
    return `${version}`.trim()
  } catch {
    return undefined
  }
}
