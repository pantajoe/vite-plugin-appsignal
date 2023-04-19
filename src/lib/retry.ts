// copied from https://github.com/sindresorhus/p-retry/blob/fb5f6f83dba20135439fa4a8b34b89b52e0eed09/index.js since p-retry is a pure ES module.

import type { WrapOptions } from 'retry'
import retry from 'retry'

export type Options = WrapOptions & {
  /**
	Callback invoked on each retry. Receives the error thrown by `input` as the first argument with properties
  `attemptNumber`and `retriesLeft`which indicate the current attempt number and the number of attempts left,
  respectively.

	The `onFailedAttempt` function can return a promise. For example, to add a [delay](https://github.com/sindresorhus/delay):

	```
	import pRetry from 'p-retry';
	import delay from 'delay';

	const run = async () => { ... };

	const result = await pRetry(run, {
		onFailedAttempt: async error => {
			console.log('Waiting for 1 second before retrying');
			await delay(1000);
		}
	});
	```

	If the `onFailedAttempt` function throws, all retries will be aborted and
  the original promise will reject with the thrown error.
	*/
  readonly onFailedAttempt?: (error: FailedAttemptError) => void | Promise<void>

  /**
	You can abort retrying using [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

	When `AbortController.abort(reason)` is called, the promise will be rejected with `reason` as the error message.

	*Requires Node.js 16 or later.*

	```
	import pRetry from 'p-retry';

	const run = async () => { … };
	const controller = new AbortController();

	cancelButton.addEventListener('click', () => {
		controller.abort('User clicked cancel button');
	});

	try {
		await pRetry(run, {signal: controller.signal});
	} catch (error) {
		console.log(error.message);
		//=> 'User clicked cancel button'
	}
	```
	*/
  readonly signal?: AbortSignal
}

const networkErrorMsgs = new Set([
  'Failed to fetch', // Chrome
  'NetworkError when attempting to fetch resource.', // Firefox
  'The Internet connection appears to be offline.', // Safari
  'Network request failed', // `cross-fetch`
  'fetch failed', // Undici (Node.js)
])

export class AbortError extends Error {
  readonly name: 'AbortError'
  readonly originalError: Error

  constructor(message: string | Error) {
    super()

    if (message instanceof Error) {
      this.originalError = message
      ;({ message } = message)
    } else {
      this.originalError = new Error(message)
      this.originalError.stack = this.stack
    }

    this.name = 'AbortError'
    this.message = message
  }
}

export interface FailedAttemptError extends Error {
  attemptNumber: number
  retriesLeft: number
}

function decorateErrorWithCounts(error: FailedAttemptError, attemptNumber: number, options: Options) {
  // Minus 1 from attemptNumber because the first attempt does not count as a retry
  const retriesLeft = options.retries! - (attemptNumber - 1)

  error.attemptNumber = attemptNumber
  error.retriesLeft = retriesLeft
  return error
}

function isNetworkError(errorMessage: string) {
  return networkErrorMsgs.has(errorMessage)
}

function getDOMException(errorMessage: string) {
  return globalThis.DOMException === undefined ? new Error(errorMessage) : new DOMException(errorMessage)
}

export async function pRetry<T>(input: (attemptCount: number) => PromiseLike<T> | T, options?: Options): Promise<T> {
  return new Promise((resolve, reject) => {
    const opts = {
      onFailedAttempt() {},
      retries: 10,
      ...options,
    }

    const operation = retry.operation(options)

    operation.attempt(async (attemptNumber) => {
      try {
        resolve(await input(attemptNumber))
      } catch (error) {
        if (!(error instanceof Error)) {
          reject(new TypeError(`Non-error was thrown: "${error}". You should only throw errors.`))
          return
        }

        if (error instanceof AbortError) {
          operation.stop()
          reject(error.originalError)
        } else if (error instanceof TypeError && !isNetworkError(error.message)) {
          operation.stop()
          reject(error)
        } else {
          decorateErrorWithCounts(error as FailedAttemptError, attemptNumber, opts)

          try {
            await options?.onFailedAttempt?.(error as FailedAttemptError)
          } catch (error) {
            reject(error)
            return
          }

          if (!operation.retry(error)) {
            reject(operation.mainError())
          }
        }
      }
    })

    if (opts.signal && !opts.signal.aborted) {
      opts.signal.addEventListener(
        'abort',
        () => {
          operation.stop()
          const reason =
            options?.signal?.reason === undefined
              ? getDOMException('The operation was aborted.')
              : options.signal.reason
          reject(reason instanceof Error ? reason : getDOMException(reason))
        },
        {
          once: true,
        },
      )
    }
  })
}
