import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

type MockDbState = {
  userVersion: number
  kv: Map<string, string>
}

const mockDbByPath = new Map<string, MockDbState>()

class MockDatabase {
  private readonly state: MockDbState

  public constructor(private readonly dbPath: string) {
    const existing = mockDbByPath.get(dbPath)
    if (existing) {
      this.state = existing
      return
    }

    const next: MockDbState = { userVersion: 0, kv: new Map() }
    mockDbByPath.set(dbPath, next)
    this.state = next
  }

  public pragma(query: string, options?: { simple?: boolean }): unknown {
    if (query === 'user_version' && options?.simple === true) {
      return this.state.userVersion
    }

    const match = query.match(/^user_version\s*=\s*(\d+)$/)
    if (match) {
      this.state.userVersion = Number(match[1])
      return undefined
    }

    return undefined
  }

  public exec(_sql: string): void {}

  public prepare(sql: string): {
    get?: (key: string) => { value: string } | undefined
    run?: (key: string, value: string) => void
  } {
    if (sql.includes('SELECT value FROM kv')) {
      return {
        get: (key: string) => {
          const value = this.state.kv.get(key)
          return typeof value === 'string' ? { value } : undefined
        },
      }
    }

    if (sql.includes('INSERT INTO kv')) {
      return {
        run: (key: string, value: string) => {
          this.state.kv.set(key, value)
        },
      }
    }

    throw new Error(`MockDatabase does not support query: ${sql}`)
  }

  public transaction<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => TResult,
  ): (...args: TArgs) => TResult {
    return (...args: TArgs) => fn(...args)
  }

  public close(): void {}
}

vi.mock('better-sqlite3', () => ({ default: MockDatabase }))

describe('WorkspaceStatePersistenceStore', () => {
  let tempDir = ''

  afterEach(async () => {
    if (!tempDir) {
      return
    }

    await rm(tempDir, { recursive: true, force: true })
    tempDir = ''
  })

  it('reads null when empty', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cove-persist-'))
    const dbPath = join(tempDir, 'cove.db')

    const { createWorkspaceStatePersistenceStore } =
      await import('../../../src/main/modules/persistence/WorkspaceStatePersistenceStore')

    const store = await createWorkspaceStatePersistenceStore({ dbPath })

    expect(await store.readWorkspaceStateRaw()).toBeNull()

    store.dispose()
  })

  it('writes and reads back the raw payload', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cove-persist-'))
    const dbPath = join(tempDir, 'cove.db')

    const { createWorkspaceStatePersistenceStore } =
      await import('../../../src/main/modules/persistence/WorkspaceStatePersistenceStore')

    const store = await createWorkspaceStatePersistenceStore({ dbPath })

    const raw = JSON.stringify({ formatVersion: 1, activeWorkspaceId: null, workspaces: [] })
    const writeResult = await store.writeWorkspaceStateRaw(raw)

    expect(writeResult.ok).toBe(true)
    if (writeResult.ok) {
      expect(writeResult.level).toBe('full')
      expect(writeResult.bytes).toBe(raw.length)
    }

    expect(await store.readWorkspaceStateRaw()).toBe(raw)

    store.dispose()
  })

  it('persists across store instances', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cove-persist-'))
    const dbPath = join(tempDir, 'cove.db')

    const { createWorkspaceStatePersistenceStore } =
      await import('../../../src/main/modules/persistence/WorkspaceStatePersistenceStore')

    const store1 = await createWorkspaceStatePersistenceStore({ dbPath })
    const raw1 = JSON.stringify({ formatVersion: 1, activeWorkspaceId: 'a', workspaces: [] })
    await store1.writeWorkspaceStateRaw(raw1)
    store1.dispose()

    const store2 = await createWorkspaceStatePersistenceStore({ dbPath })
    expect(await store2.readWorkspaceStateRaw()).toBe(raw1)
    store2.dispose()
  })

  it('overwrites existing values', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cove-persist-'))
    const dbPath = join(tempDir, 'cove.db')

    const { createWorkspaceStatePersistenceStore } =
      await import('../../../src/main/modules/persistence/WorkspaceStatePersistenceStore')

    const store = await createWorkspaceStatePersistenceStore({ dbPath })

    const raw1 = JSON.stringify({ formatVersion: 1, activeWorkspaceId: 'a', workspaces: [] })
    const raw2 = JSON.stringify({ formatVersion: 1, activeWorkspaceId: 'b', workspaces: [] })

    await store.writeWorkspaceStateRaw(raw1)
    await store.writeWorkspaceStateRaw(raw2)

    expect(await store.readWorkspaceStateRaw()).toBe(raw2)

    store.dispose()
  })

  it('rejects payloads exceeding max bytes', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cove-persist-'))
    const dbPath = join(tempDir, 'cove.db')

    const { createWorkspaceStatePersistenceStore } =
      await import('../../../src/main/modules/persistence/WorkspaceStatePersistenceStore')

    const store = await createWorkspaceStatePersistenceStore({ dbPath, maxRawBytes: 10 })

    const raw = '01234567890'
    const result = await store.writeWorkspaceStateRaw(raw)

    expect(result).toEqual({
      ok: false,
      reason: 'payload_too_large',
      message: expect.stringContaining('too large'),
    })

    expect(await store.readWorkspaceStateRaw()).toBeNull()

    store.dispose()
  })
})
