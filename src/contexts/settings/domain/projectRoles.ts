import { normalizeTextValue } from './settingsNormalization'

export interface ProjectRoleDefinition {
  id: string
  name: string
  description: string
  promptTemplate: string
  inputHint: string
  outputFormat: string
  createdAt: string
  updatedAt: string
}

export type ProjectRolesByWorkspaceId = Record<string, ProjectRoleDefinition[]>

const MAX_PROJECT_ROLES_PER_WORKSPACE = 100
const MAX_PROJECT_ROLE_NAME_LENGTH = 80
const MAX_PROJECT_ROLE_DESCRIPTION_LENGTH = 1_000
const MAX_PROJECT_ROLE_PROMPT_TEMPLATE_LENGTH = 40_000
const MAX_PROJECT_ROLE_INPUT_HINT_LENGTH = 4_000
const MAX_PROJECT_ROLE_OUTPUT_FORMAT_LENGTH = 8_000

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeProjectRoleDefinition(value: unknown): ProjectRoleDefinition | null {
  if (!isPlainRecord(value)) {
    return null
  }

  const id = normalizeTextValue(value.id)
  const name = normalizeTextValue(value.name).slice(0, MAX_PROJECT_ROLE_NAME_LENGTH)
  const promptTemplate = normalizeTextValue(value.promptTemplate).slice(
    0,
    MAX_PROJECT_ROLE_PROMPT_TEMPLATE_LENGTH,
  )

  if (id.length === 0 || name.length === 0 || promptTemplate.length === 0) {
    return null
  }

  return {
    id,
    name,
    description: normalizeTextValue(value.description).slice(
      0,
      MAX_PROJECT_ROLE_DESCRIPTION_LENGTH,
    ),
    promptTemplate,
    inputHint: normalizeTextValue(value.inputHint).slice(0, MAX_PROJECT_ROLE_INPUT_HINT_LENGTH),
    outputFormat: normalizeTextValue(value.outputFormat).slice(
      0,
      MAX_PROJECT_ROLE_OUTPUT_FORMAT_LENGTH,
    ),
    createdAt: normalizeTextValue(value.createdAt),
    updatedAt: normalizeTextValue(value.updatedAt),
  }
}

function toRoleNameKey(name: string): string {
  return name.trim().toLowerCase()
}

export function normalizeProjectRoles(value: unknown): ProjectRoleDefinition[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalized: ProjectRoleDefinition[] = []
  const seenIds = new Set<string>()
  const seenNames = new Set<string>()

  for (const item of value) {
    const role = normalizeProjectRoleDefinition(item)
    if (!role) {
      continue
    }

    const nameKey = toRoleNameKey(role.name)
    if (seenIds.has(role.id) || seenNames.has(nameKey)) {
      continue
    }

    seenIds.add(role.id)
    seenNames.add(nameKey)
    normalized.push(role)

    if (normalized.length >= MAX_PROJECT_ROLES_PER_WORKSPACE) {
      break
    }
  }

  return normalized
}

export function normalizeProjectRolesByWorkspaceId(value: unknown): ProjectRolesByWorkspaceId {
  if (!isPlainRecord(value)) {
    return {}
  }

  const normalized: ProjectRolesByWorkspaceId = {}
  for (const [workspaceId, rawRoles] of Object.entries(value)) {
    const normalizedWorkspaceId = workspaceId.trim()
    if (normalizedWorkspaceId.length === 0) {
      continue
    }

    const roles = normalizeProjectRoles(rawRoles)
    if (roles.length === 0) {
      continue
    }

    normalized[normalizedWorkspaceId] = roles
  }

  return normalized
}
