import { normalizeAgentSettings } from '@contexts/settings/domain/agentSettings'
import type { PersistedAppState, PersistedWorkspaceState } from '../../types'
import { ensurePersistedWorkspace } from './ensure'
import { getPersistencePort, readLegacyLocalStorageRaw } from './port'
import type { PersistenceRecoveryReason } from '@shared/contracts/dto'

function parsePersistedStateValue(value: unknown): PersistedAppState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
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
}

function parseRawPersistedState(raw: string): PersistedAppState | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsePersistedStateValue(parsed)
  } catch {
    return null
  }
}

function stripScrollbackFromState(state: PersistedAppState): PersistedAppState {
  return {
    ...state,
    workspaces: state.workspaces.map(workspace => ({
      ...workspace,
      nodes: workspace.nodes.map(node => ({ ...node, scrollback: null })),
    })),
  }
}

export async function readPersistedStateWithMeta(): Promise<{
  state: PersistedAppState | null
  recovery: PersistenceRecoveryReason | null
}> {
  const port = getPersistencePort()
  if (!port) {
    return { state: null, recovery: null }
  }

  const primary = await port.readAppState()
  const recovery = primary?.recovery ?? null

  if (primary?.state) {
    const parsed = parsePersistedStateValue(primary.state)
    if (parsed) {
      return { state: parsed, recovery }
    }
  }

  if (port.kind !== 'ipc') {
    return { state: null, recovery }
  }

  const legacyRaw = readLegacyLocalStorageRaw()
  if (!legacyRaw) {
    return { state: null, recovery }
  }

  const legacyParsed = parseRawPersistedState(legacyRaw)
  if (!legacyParsed) {
    return { state: null, recovery }
  }

  const migratedState = stripScrollbackFromState(legacyParsed)
  const migratedAppStateResult = await port.writeAppState(migratedState)
  if (!migratedAppStateResult.ok) {
    return { state: migratedState, recovery }
  }

  await Promise.allSettled(
    legacyParsed.workspaces.flatMap(workspace =>
      workspace.nodes
        .filter(node => typeof node.scrollback === 'string' && node.scrollback.length > 0)
        .map(node => port.writeNodeScrollback(node.id, node.scrollback)),
    ),
  )

  return { state: migratedState, recovery }
}

export async function readPersistedState(): Promise<PersistedAppState | null> {
  const { state } = await readPersistedStateWithMeta()
  return state
}
