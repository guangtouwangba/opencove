import { describe, expect, it, vi } from 'vitest'
import { IPC_CHANNELS } from '../../../src/shared/constants/ipc'
import type { PersistWriteResult } from '../../../src/shared/types/api'

function createIpcHarness() {
  const handlers = new Map<string, (...args: unknown[]) => unknown>()
  const ipcMain = {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
      handlers.set(channel, handler)
    }),
    removeHandler: vi.fn((channel: string) => {
      handlers.delete(channel)
    }),
  }

  return { handlers, ipcMain }
}

describe('persistence IPC handlers', () => {
  it('reads persisted raw workspace state through the store', async () => {
    vi.resetModules()

    const { handlers, ipcMain } = createIpcHarness()
    vi.doMock('electron', () => ({ ipcMain }))

    const store = {
      readWorkspaceStateRaw: vi.fn(async () => '{"formatVersion":1}'),
      writeWorkspaceStateRaw: vi.fn(
        async (_raw: string): Promise<PersistWriteResult> => ({
          ok: true,
          level: 'full',
          bytes: 0,
        }),
      ),
      dispose: vi.fn(),
    }

    const { registerPersistenceIpcHandlers } =
      await import('../../../src/main/modules/persistence/ipc/register')

    registerPersistenceIpcHandlers(async () => store)

    const readHandler = handlers.get(IPC_CHANNELS.persistenceReadWorkspaceStateRaw)
    expect(readHandler).toBeTypeOf('function')

    await expect(readHandler?.()).resolves.toBe('{"formatVersion":1}')
    expect(store.readWorkspaceStateRaw).toHaveBeenCalledTimes(1)
  })

  it('writes persisted raw workspace state through the store', async () => {
    vi.resetModules()

    const { handlers, ipcMain } = createIpcHarness()
    vi.doMock('electron', () => ({ ipcMain }))

    const writeResult: PersistWriteResult = { ok: true, level: 'full', bytes: 12 }

    const store = {
      readWorkspaceStateRaw: vi.fn(async () => null),
      writeWorkspaceStateRaw: vi.fn(async (_raw: string) => writeResult),
      dispose: vi.fn(),
    }

    const { registerPersistenceIpcHandlers } =
      await import('../../../src/main/modules/persistence/ipc/register')

    registerPersistenceIpcHandlers(async () => store)

    const writeHandler = handlers.get(IPC_CHANNELS.persistenceWriteWorkspaceStateRaw)
    expect(writeHandler).toBeTypeOf('function')

    const raw = JSON.stringify({ formatVersion: 1, activeWorkspaceId: null, workspaces: [] })

    await expect(writeHandler?.(null, { raw })).resolves.toEqual(writeResult)
    expect(store.writeWorkspaceStateRaw).toHaveBeenCalledWith(raw)
  })

  it('rejects invalid payloads without calling the store', async () => {
    vi.resetModules()

    const { handlers, ipcMain } = createIpcHarness()
    vi.doMock('electron', () => ({ ipcMain }))

    const store = {
      readWorkspaceStateRaw: vi.fn(async () => null),
      writeWorkspaceStateRaw: vi.fn(
        async (_raw: string): Promise<PersistWriteResult> => ({
          ok: true,
          level: 'full',
          bytes: 0,
        }),
      ),
      dispose: vi.fn(),
    }

    const { registerPersistenceIpcHandlers } =
      await import('../../../src/main/modules/persistence/ipc/register')

    registerPersistenceIpcHandlers(async () => store)

    const writeHandler = handlers.get(IPC_CHANNELS.persistenceWriteWorkspaceStateRaw)
    expect(writeHandler).toBeTypeOf('function')

    const result = (await writeHandler?.(null, { raw: '{not-json' })) as PersistWriteResult

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('unknown')
    }

    expect(store.writeWorkspaceStateRaw).not.toHaveBeenCalled()
  })

  it('enforces the raw payload max bytes', async () => {
    vi.resetModules()

    const { handlers, ipcMain } = createIpcHarness()
    vi.doMock('electron', () => ({ ipcMain }))

    const store = {
      readWorkspaceStateRaw: vi.fn(async () => null),
      writeWorkspaceStateRaw: vi.fn(
        async (_raw: string): Promise<PersistWriteResult> => ({
          ok: true,
          level: 'full',
          bytes: 0,
        }),
      ),
      dispose: vi.fn(),
    }

    const { registerPersistenceIpcHandlers } =
      await import('../../../src/main/modules/persistence/ipc/register')

    registerPersistenceIpcHandlers(async () => store, { maxRawBytes: 10 })

    const writeHandler = handlers.get(IPC_CHANNELS.persistenceWriteWorkspaceStateRaw)
    expect(writeHandler).toBeTypeOf('function')

    const raw = JSON.stringify({ formatVersion: 1, activeWorkspaceId: null, workspaces: [] })
    expect(raw.length).toBeGreaterThan(10)

    await expect(writeHandler?.(null, { raw })).resolves.toEqual({
      ok: false,
      reason: 'payload_too_large',
      message: expect.stringContaining('too large'),
    })

    expect(store.writeWorkspaceStateRaw).not.toHaveBeenCalled()
  })

  it('removes IPC handlers on dispose', async () => {
    vi.resetModules()

    const { handlers, ipcMain } = createIpcHarness()
    vi.doMock('electron', () => ({ ipcMain }))

    const store = {
      readWorkspaceStateRaw: vi.fn(async () => null),
      writeWorkspaceStateRaw: vi.fn(
        async (_raw: string): Promise<PersistWriteResult> => ({
          ok: true,
          level: 'full',
          bytes: 0,
        }),
      ),
      dispose: vi.fn(),
    }

    const { registerPersistenceIpcHandlers } =
      await import('../../../src/main/modules/persistence/ipc/register')

    const disposable = registerPersistenceIpcHandlers(async () => store)

    disposable.dispose()

    expect(ipcMain.removeHandler).toHaveBeenCalledWith(
      IPC_CHANNELS.persistenceReadWorkspaceStateRaw,
    )
    expect(ipcMain.removeHandler).toHaveBeenCalledWith(
      IPC_CHANNELS.persistenceWriteWorkspaceStateRaw,
    )
    expect(handlers.size).toBe(0)
  })
})
