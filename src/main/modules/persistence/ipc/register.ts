import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../../shared/constants/ipc'
import type { PersistWriteResult } from '../../../../shared/types/api'
import type { IpcRegistrationDisposable } from '../../../ipc/types'
import type { WorkspaceStatePersistenceStore } from '../WorkspaceStatePersistenceStore'
import { PayloadTooLargeError, normalizeWriteWorkspaceStateRawPayload } from './validate'

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return typeof error === 'string' ? error : 'Unknown error'
}

export function registerPersistenceIpcHandlers(
  getStore: () => Promise<WorkspaceStatePersistenceStore>,
  options: { maxRawBytes?: number } = {},
): IpcRegistrationDisposable {
  ipcMain.handle(
    IPC_CHANNELS.persistenceReadWorkspaceStateRaw,
    async (): Promise<string | null> => {
      try {
        const store = await getStore()
        return await store.readWorkspaceStateRaw()
      } catch {
        return null
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.persistenceWriteWorkspaceStateRaw,
    async (_event, payload: unknown): Promise<PersistWriteResult> => {
      let normalized: { raw: string }

      try {
        normalized = normalizeWriteWorkspaceStateRawPayload(payload, options)
      } catch (error) {
        return {
          ok: false,
          reason: error instanceof PayloadTooLargeError ? 'payload_too_large' : 'unknown',
          message: toErrorMessage(error),
        }
      }

      try {
        const store = await getStore()
        return await store.writeWorkspaceStateRaw(normalized.raw)
      } catch (error) {
        return { ok: false, reason: 'io', message: toErrorMessage(error) }
      }
    },
  )

  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.persistenceReadWorkspaceStateRaw)
      ipcMain.removeHandler(IPC_CHANNELS.persistenceWriteWorkspaceStateRaw)
    },
  }
}
