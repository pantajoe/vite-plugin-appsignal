import { exec } from 'node:child_process'

interface Options {
  revision?: string
}

function getRevisionFromGit(): Promise<string> {
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
export async function getRevision(options: Options = {}) {
  try {
    const version = await (options.revision ? Promise.resolve(options.revision) : getRevisionFromGit())
    return `${version}`.trim()
  } catch {
    return undefined
  }
}
