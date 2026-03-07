import { useMemo } from 'react'
import type { Node } from '@xyflow/react'
import type { TerminalNodeData } from '../../../types'
import type { TaskAssignerState } from '../types'

export function useWorkspaceCanvasTaskAssignerOptions({
  nodes,
  taskAssigner,
}: {
  nodes: Node<TerminalNodeData>[]
  taskAssigner: TaskAssignerState | null
}): {
  taskAssignerAgentOptions: Array<{
    nodeId: string
    title: string
    status: TerminalNodeData['status']
    linkedTaskTitle: string | null
  }>
  activeTaskForAssigner: Node<TerminalNodeData> | null
} {
  const taskAssignerAgentOptions = useMemo(() => {
    const taskTitleById = new Map(
      nodes.filter(node => node.data.kind === 'task').map(node => [node.id, node.data.title]),
    )

    return nodes
      .filter(node => node.data.kind === 'agent' && node.data.agent)
      .map(node => ({
        nodeId: node.id,
        title: node.data.title,
        status: node.data.status,
        linkedTaskTitle: node.data.agent?.taskId
          ? (taskTitleById.get(node.data.agent.taskId) ?? null)
          : null,
      }))
  }, [nodes])

  const activeTaskForAssigner = useMemo(() => {
    if (!taskAssigner) {
      return null
    }

    return (
      nodes.find(node => node.id === taskAssigner.taskNodeId && node.data.kind === 'task') ?? null
    )
  }, [nodes, taskAssigner])

  return {
    taskAssignerAgentOptions,
    activeTaskForAssigner,
  }
}
