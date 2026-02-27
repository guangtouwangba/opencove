import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentSettings } from '../../features/settings/agentConfig'
import type { PersistedAppState, WorkspaceState } from '../../features/workspace/types'
import {
  flushScheduledPersistedStateWrite,
  type PersistWriteResult,
  schedulePersistedStateWrite,
} from '../../features/workspace/utils/persistence'
import type { PersistNotice } from '../types'

export function usePersistedAppState({
  workspaces,
  activeWorkspaceId,
  agentSettings,
  isHydrated,
  producePersistedState,
}: {
  workspaces: WorkspaceState[]
  activeWorkspaceId: string | null
  agentSettings: AgentSettings
  isHydrated: boolean
  producePersistedState: () => PersistedAppState
}): {
  persistNotice: PersistNotice | null
  requestPersistFlush: () => void
  flushPersistNow: () => void
} {
  const [persistNotice, setPersistNotice] = useState<PersistNotice | null>(null)
  const persistFlushRequestedRef = useRef(false)

  const requestPersistFlush = useCallback(() => {
    persistFlushRequestedRef.current = true
  }, [])

  const handlePersistWriteResult = useCallback((result: PersistWriteResult) => {
    setPersistNotice(previous => {
      if (result.ok) {
        if (result.level === 'full') {
          return null
        }

        const message =
          result.level === 'no_scrollback'
            ? 'Storage quota reached; saved without terminal history.'
            : 'Storage quota reached; saved settings only.'

        const next: PersistNotice = { tone: 'warning', message }
        return previous?.tone === next.tone && previous.message === next.message ? previous : next
      }

      const message =
        result.reason === 'unavailable'
          ? 'Storage is unavailable; changes will not be saved.'
          : result.reason === 'quota' || result.reason === 'payload_too_large'
            ? 'Storage limit exceeded; unable to persist workspace state.'
            : result.reason === 'io'
              ? `Persistence I/O failed: ${result.message}`
              : `Persistence failed: ${result.message}`

      const next: PersistNotice = { tone: 'error', message }
      return previous?.tone === next.tone && previous.message === next.message ? previous : next
    })
  }, [])

  useEffect(() => {
    if (window.coveApi.meta.isTest) {
      return
    }

    const handleBeforeUnload = () => {
      flushScheduledPersistedStateWrite()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      flushScheduledPersistedStateWrite()
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    schedulePersistedStateWrite(producePersistedState, { onResult: handlePersistWriteResult })

    if (persistFlushRequestedRef.current) {
      persistFlushRequestedRef.current = false
      flushScheduledPersistedStateWrite()
    }
  }, [
    activeWorkspaceId,
    agentSettings,
    handlePersistWriteResult,
    isHydrated,
    producePersistedState,
    workspaces,
  ])

  const flushPersistNow = useCallback(() => {
    schedulePersistedStateWrite(producePersistedState, {
      delayMs: 0,
      onResult: handlePersistWriteResult,
    })
    flushScheduledPersistedStateWrite()
  }, [handlePersistWriteResult, producePersistedState])

  return { persistNotice, requestPersistFlush, flushPersistNow }
}
