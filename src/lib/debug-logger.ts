/* eslint-disable no-console */
import { inspect } from 'node:util'

/*
  Simple debug logger
*/
export function debugLogger(label: string, data?: any) {
  if (data) {
    console.log(`[Appsignal Vite Plugin] ${label} ${inspect(data, false, null, true)}`)
  } else {
    console.log(`[Appsignal Vite Plugin] ${label}`)
  }
}
