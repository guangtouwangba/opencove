import type { RoleNodeData, RoleRunRecord } from '../../types'
import { normalizeOptionalString, normalizeProvider } from './normalize'

function ensurePersistedRoleRunRecords(value: unknown): RoleRunRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  const records: RoleRunRecord[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const record = item as Record<string, unknown>
    const id = normalizeOptionalString(record.id)
    const input = typeof record.input === 'string' ? record.input : ''
    const prompt = typeof record.prompt === 'string' ? record.prompt : ''
    const outputFormat = typeof record.outputFormat === 'string' ? record.outputFormat : ''
    const createdAt = normalizeOptionalString(record.createdAt)

    if (!id || !createdAt) {
      continue
    }

    records.push({
      id,
      input,
      prompt,
      outputFormat,
      provider: normalizeProvider(record.provider),
      agentNodeId: normalizeOptionalString(record.agentNodeId),
      sessionId: normalizeOptionalString(record.sessionId),
      createdAt,
    })

    if (records.length >= 50) {
      break
    }
  }

  return records
}

export function ensurePersistedRoleData(value: unknown): RoleNodeData | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const roleId = normalizeOptionalString(record.roleId)
  const roleName = normalizeOptionalString(record.roleName)
  const promptTemplate = typeof record.promptTemplate === 'string' ? record.promptTemplate : ''

  if (!roleId || !roleName) {
    return null
  }

  return {
    roleId,
    roleName,
    roleDescription: typeof record.roleDescription === 'string' ? record.roleDescription : '',
    promptTemplate,
    inputHint: typeof record.inputHint === 'string' ? record.inputHint : '',
    outputFormat: typeof record.outputFormat === 'string' ? record.outputFormat : '',
    input: typeof record.input === 'string' ? record.input : '',
    selectedProvider: normalizeProvider(record.selectedProvider),
    linkedAgentNodeId: normalizeOptionalString(record.linkedAgentNodeId),
    runHistory: ensurePersistedRoleRunRecords(record.runHistory),
    createdAt: normalizeOptionalString(record.createdAt),
    updatedAt: normalizeOptionalString(record.updatedAt),
  }
}
