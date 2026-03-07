import type { Node } from '@xyflow/react'
import type { TerminalNodeData } from '../../types'

export function resolveWorkspaceMinimapNodeColor(node: Node<TerminalNodeData>): string {
  switch (node.data.kind) {
    case 'agent':
      return 'rgba(111, 188, 255, 0.72)'
    case 'task':
      return 'rgba(168, 160, 255, 0.72)'
    default:
      return 'rgba(130, 156, 255, 0.72)'
  }
}
