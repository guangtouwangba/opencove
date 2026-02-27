import type { PersistedAppState } from '../../types'
import { DEFAULT_PERSIST_WRITE_DEBOUNCE_MS } from './constants'
import type { PersistWriteResult } from './types'
import { writePersistedState } from './write'

let scheduledPersistedStateProducer: (() => PersistedAppState) | null = null
let scheduledPersistedStateTimer: number | null = null
let scheduledPersistedStateOnResult: ((result: PersistWriteResult) => void) | null = null
let persistFlushInFlight = false
let persistFlushRequested = false

export function schedulePersistedStateWrite(
  producer: () => PersistedAppState,
  options: { delayMs?: number; onResult?: (result: PersistWriteResult) => void } = {},
): void {
  if (typeof window === 'undefined') {
    return
  }

  scheduledPersistedStateProducer = producer
  scheduledPersistedStateOnResult = options.onResult ?? null

  if (scheduledPersistedStateTimer !== null) {
    return
  }

  const delayMs = options.delayMs ?? DEFAULT_PERSIST_WRITE_DEBOUNCE_MS
  scheduledPersistedStateTimer = window.setTimeout(() => {
    scheduledPersistedStateTimer = null
    flushScheduledPersistedStateWrite()
  }, delayMs)
}

export function flushScheduledPersistedStateWrite(): void {
  if (typeof window !== 'undefined' && scheduledPersistedStateTimer !== null) {
    window.clearTimeout(scheduledPersistedStateTimer)
    scheduledPersistedStateTimer = null
  }

  const producer = scheduledPersistedStateProducer
  scheduledPersistedStateProducer = null

  const onResult = scheduledPersistedStateOnResult
  scheduledPersistedStateOnResult = null

  if (persistFlushInFlight) {
    persistFlushRequested = true
    return
  }

  if (!producer) {
    return
  }

  persistFlushInFlight = true

  void writePersistedState(producer())
    .then(result => {
      onResult?.(result)
    })
    .finally(() => {
      persistFlushInFlight = false

      if (!persistFlushRequested) {
        return
      }

      persistFlushRequested = false

      if (scheduledPersistedStateProducer) {
        flushScheduledPersistedStateWrite()
      }
    })
}
