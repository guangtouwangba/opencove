import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import type { PersistWriteResult } from '../../../shared/types/api'

const DB_SCHEMA_VERSION = 1
const WORKSPACE_STATE_KEY = 'workspace-state-raw'
export const DEFAULT_MAX_WORKSPACE_STATE_RAW_BYTES = 50 * 1024 * 1024

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return typeof error === 'string' ? error : 'Unknown error'
}

function migrate(db: Database.Database): void {
  const version = db.pragma('user_version', { simple: true }) as unknown
  const currentVersion = typeof version === 'number' ? version : 0

  if (currentVersion >= DB_SCHEMA_VERSION) {
    return
  }

  const runMigration = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)

    db.pragma(`user_version = ${DB_SCHEMA_VERSION}`)
  })

  runMigration()
}

export interface WorkspaceStatePersistenceStore {
  readWorkspaceStateRaw: () => Promise<string | null>
  writeWorkspaceStateRaw: (raw: string) => Promise<PersistWriteResult>
  dispose: () => void
}

export async function createWorkspaceStatePersistenceStore(options: {
  dbPath: string
  maxRawBytes?: number
}): Promise<WorkspaceStatePersistenceStore> {
  const maxRawBytes = options.maxRawBytes ?? DEFAULT_MAX_WORKSPACE_STATE_RAW_BYTES

  await mkdir(dirname(options.dbPath), { recursive: true })

  const db = new Database(options.dbPath)
  migrate(db)

  const readStmt = db.prepare('SELECT value FROM kv WHERE key = ?')
  const writeStmt = db.prepare(
    `
      INSERT INTO kv (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
  )
  const writeTx = db.transaction((raw: string) => {
    writeStmt.run(WORKSPACE_STATE_KEY, raw)
  })

  return {
    readWorkspaceStateRaw: async () => {
      try {
        const row = readStmt.get(WORKSPACE_STATE_KEY) as { value: string } | undefined
        return typeof row?.value === 'string' ? row.value : null
      } catch {
        return null
      }
    },
    writeWorkspaceStateRaw: async (raw: string) => {
      if (raw.length > maxRawBytes) {
        return {
          ok: false,
          reason: 'payload_too_large',
          message: `Workspace state payload too large to persist (${raw.length} bytes).`,
        }
      }

      try {
        writeTx(raw)
        return { ok: true, level: 'full', bytes: raw.length }
      } catch (error) {
        return { ok: false, reason: 'io', message: toErrorMessage(error) }
      }
    },
    dispose: () => {
      try {
        db.close()
      } catch {
        // ignore
      }
    },
  }
}
