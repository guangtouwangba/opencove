import type { PersistWriteResult } from '@shared/types/api'
import { STORAGE_KEY } from './constants'
import { getStorage, isQuotaExceededError } from './storage'

export type PersistencePortKind = 'ipc' | 'localStorage'

export interface PersistencePort {
  kind: PersistencePortKind
  readRaw: () => Promise<string | null>
  writeRaw: (raw: string) => Promise<PersistWriteResult>
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return typeof error === 'string' ? error : 'Unknown error'
}

function createIpcPort(): PersistencePort | null {
  if (typeof window === 'undefined') {
    return null
  }

  const persistenceApi = window.coveApi?.persistence
  if (!persistenceApi) {
    return null
  }

  return {
    kind: 'ipc',
    readRaw: async () => {
      try {
        return await persistenceApi.readWorkspaceStateRaw()
      } catch {
        return null
      }
    },
    writeRaw: async raw => {
      try {
        return await persistenceApi.writeWorkspaceStateRaw({ raw })
      } catch (error) {
        return { ok: false, reason: 'io', message: toErrorMessage(error) }
      }
    },
  }
}

function createLocalStoragePort(): PersistencePort | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  return {
    kind: 'localStorage',
    readRaw: async () => storage.getItem(STORAGE_KEY),
    writeRaw: async raw => {
      try {
        storage.setItem(STORAGE_KEY, raw)
        return { ok: true, level: 'full', bytes: raw.length }
      } catch (error) {
        return {
          ok: false,
          reason: isQuotaExceededError(error) ? 'quota' : 'unknown',
          message: toErrorMessage(error),
        }
      }
    },
  }
}

export function getPersistencePort(): PersistencePort | null {
  return createIpcPort() ?? createLocalStoragePort()
}

export function readLegacyLocalStorageRaw(): string | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  return storage.getItem(STORAGE_KEY)
}
