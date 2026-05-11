import type { Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import type { TerminalNodeData } from '../../../src/contexts/workspace/presentation/renderer/types'
import { resolveNodeRoleDefinition } from '../../../src/contexts/workspace/presentation/renderer/components/workspaceCanvas/hooks/useRoleActions.run'

function createRoleNode(): Node<TerminalNodeData> {
  return {
    id: 'role-node-1',
    position: { x: 0, y: 0 },
    data: {
      sessionId: '',
      title: 'Product Manager',
      width: 360,
      height: 320,
      kind: 'role',
      status: null,
      startedAt: null,
      endedAt: null,
      exitCode: null,
      lastError: null,
      scrollback: null,
      agent: null,
      task: null,
      note: null,
      role: {
        roleId: 'role-pm',
        roleName: 'Product Manager',
        roleDescription: 'Own requirements',
        promptTemplate: 'Write product requirements.',
        inputHint: 'Feature brief',
        outputFormat: 'PRD',
        input: '',
        selectedProvider: 'codex',
        linkedAgentNodeId: null,
        runHistory: [],
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
      image: null,
      document: null,
      website: null,
    },
  }
}

describe('resolveNodeRoleDefinition', () => {
  it('reads the authoritative role definition from project settings', () => {
    const role = resolveNodeRoleDefinition(createRoleNode(), [
      {
        id: 'role-pm',
        name: 'Product Manager',
        description: 'Own requirements',
        promptTemplate: 'Write product requirements.',
        inputHint: 'Feature brief',
        outputFormat: 'PRD',
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      },
    ])

    expect(role).toMatchObject({
      id: 'role-pm',
      name: 'Product Manager',
      promptTemplate: 'Write product requirements.',
    })
  })

  it('does not fall back to executable node snapshot data when the project role is missing', () => {
    expect(resolveNodeRoleDefinition(createRoleNode(), [])).toBeNull()
  })
})
