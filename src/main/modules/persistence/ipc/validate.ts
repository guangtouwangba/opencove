import type { WriteWorkspaceStateRawInput } from '../../../../shared/types/api'

const DEFAULT_MAX_RAW_BYTES = 50 * 1024 * 1024

export class PayloadTooLargeError extends Error {
  public readonly bytes: number
  public readonly maxBytes: number

  public constructor(bytes: number, maxBytes: number) {
    super(`Payload too large (${bytes} bytes > ${maxBytes} bytes).`)
    this.name = 'PayloadTooLargeError'
    this.bytes = bytes
    this.maxBytes = maxBytes
  }
}

export function normalizeWriteWorkspaceStateRawPayload(
  payload: unknown,
  options: { maxRawBytes?: number } = {},
): WriteWorkspaceStateRawInput {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload for persistence:write-workspace-state-raw')
  }

  const record = payload as Record<string, unknown>
  const raw = typeof record.raw === 'string' ? record.raw : ''

  if (raw.length === 0) {
    throw new Error('Invalid raw payload for persistence:write-workspace-state-raw')
  }

  const maxRawBytes = options.maxRawBytes ?? DEFAULT_MAX_RAW_BYTES
  if (raw.length > maxRawBytes) {
    throw new PayloadTooLargeError(raw.length, maxRawBytes)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new Error('Invalid JSON payload for persistence:write-workspace-state-raw')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Workspace state payload must be a JSON object')
  }

  return { raw }
}
