import { normalizeAgentSettings } from '../../../settings/agentConfig'
import type { PersistedAppState, PersistedWorkspaceState } from '../../types'
import { ensurePersistedWorkspace } from './ensure'
import { getPersistencePort, readLegacyLocalStorageRaw } from './port'
import { writePersistedState } from './write'

function parseRawPersistedState(raw: string): PersistedAppState | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const record = parsed as Record<string, unknown>
    const formatVersionRaw = record.formatVersion
    const formatVersion =
      typeof formatVersionRaw === 'number' &&
      Number.isFinite(formatVersionRaw) &&
      formatVersionRaw >= 0
        ? Math.floor(formatVersionRaw)
        : 0
    const activeWorkspaceId = record.activeWorkspaceId
    const workspaces = record.workspaces

    if (activeWorkspaceId !== null && typeof activeWorkspaceId !== 'string') {
      return null
    }

    if (!Array.isArray(workspaces)) {
      return null
    }

    const normalizedWorkspaces = workspaces
      .map(item => ensurePersistedWorkspace(item))
      .filter((item): item is PersistedWorkspaceState => item !== null)

    const settings = normalizeAgentSettings(record.settings)

    return {
      formatVersion,
      activeWorkspaceId,
      workspaces: normalizedWorkspaces,
      settings,
    }
  } catch {
    return null
  }
}

export async function readPersistedState(): Promise<PersistedAppState | null> {
  const port = getPersistencePort()
  if (!port) {
    return null
  }

  const primaryRaw = await port.readRaw()
  if (primaryRaw) {
    const primaryParsed = parseRawPersistedState(primaryRaw)
    if (primaryParsed) {
      return primaryParsed
    }
  }

  if (port.kind !== 'ipc') {
    return null
  }

  const legacyRaw = readLegacyLocalStorageRaw()
  if (!legacyRaw) {
    return null
  }

  const legacyParsed = parseRawPersistedState(legacyRaw)
  if (!legacyParsed) {
    return null
  }

  const migrated = await writePersistedState(legacyParsed)
  if (!migrated.ok) {
    // Best effort only: keep legacy readable even if migration fails.
  }

  return legacyParsed
}
