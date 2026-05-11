import type { TerminalNodeData } from '../../types'

export interface WorkspaceCanvasNodeTypeProps {
  data: TerminalNodeData
  id: string
  selected?: boolean
  dragging?: boolean
}
