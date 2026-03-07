import { useCallback, useEffect, useState, type MutableRefObject } from 'react'
import type { Node } from '@xyflow/react'
import type { TerminalNodeData } from '../../../types'
import type { TaskDeleteConfirmationState } from '../types'

interface UseTaskDeleteConfirmationParams {
  nodesRef: MutableRefObject<Node<TerminalNodeData>[]>
  closeNode: (nodeId: string) => Promise<void>
  requestTaskDeleteRef: MutableRefObject<(nodeId: string) => void>
}

export function useWorkspaceCanvasTaskDeleteConfirmation({
  nodesRef,
  closeNode,
  requestTaskDeleteRef,
}: UseTaskDeleteConfirmationParams): {
  taskDeleteConfirmation: TaskDeleteConfirmationState | null
  setTaskDeleteConfirmation: React.Dispatch<
    React.SetStateAction<TaskDeleteConfirmationState | null>
  >
  confirmTaskDelete: () => Promise<void>
} {
  const [taskDeleteConfirmation, setTaskDeleteConfirmation] =
    useState<TaskDeleteConfirmationState | null>(null)

  const requestTaskDelete = useCallback(
    (nodeId: string) => {
      const node = nodesRef.current.find(item => item.id === nodeId)
      if (!node) {
        return
      }

      if (node.data.kind !== 'task') {
        void closeNode(nodeId)
        return
      }

      setTaskDeleteConfirmation({
        nodeId,
        title: node.data.title,
      })
    },
    [closeNode, nodesRef],
  )

  const confirmTaskDelete = useCallback(async () => {
    if (!taskDeleteConfirmation) {
      return
    }

    await closeNode(taskDeleteConfirmation.nodeId)
    setTaskDeleteConfirmation(null)
  }, [closeNode, taskDeleteConfirmation])

  useEffect(() => {
    requestTaskDeleteRef.current = nodeId => {
      requestTaskDelete(nodeId)
    }
  }, [requestTaskDelete, requestTaskDeleteRef])

  return {
    taskDeleteConfirmation,
    setTaskDeleteConfirmation,
    confirmTaskDelete,
  }
}
