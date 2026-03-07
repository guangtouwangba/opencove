import { useCallback, useEffect, useState, type MutableRefObject } from 'react'
import type { Node } from '@xyflow/react'
import type { TerminalNodeData, WorkspaceSpaceState } from '../../../types'
import { isAgentWorking, toErrorMessage } from '../helpers'
import type { ContextMenuState, TaskAssignerState } from '../types'

interface UseTaskAssignerParams {
  nodesRef: MutableRefObject<Node<TerminalNodeData>[]>
  spacesRef: MutableRefObject<WorkspaceSpaceState[]>
  onSpacesChange: (spaces: WorkspaceSpaceState[]) => void
  setNodes: (
    updater: (prevNodes: Node<TerminalNodeData>[]) => Node<TerminalNodeData>[],
    options?: { syncLayout?: boolean },
  ) => void
  onRequestPersistFlush?: () => void
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>
  openTaskAssignerRef: MutableRefObject<(nodeId: string) => void>
}

export function useWorkspaceCanvasTaskAssigner({
  nodesRef,
  spacesRef,
  onSpacesChange,
  setNodes,
  onRequestPersistFlush,
  setContextMenu,
  openTaskAssignerRef,
}: UseTaskAssignerParams): {
  taskAssigner: TaskAssignerState | null
  setTaskAssigner: React.Dispatch<React.SetStateAction<TaskAssignerState | null>>
  closeTaskAssigner: () => void
  applyTaskAssignment: () => Promise<void>
} {
  const [taskAssigner, setTaskAssigner] = useState<TaskAssignerState | null>(null)

  const openTaskAssigner = useCallback(
    (nodeId: string) => {
      const node = nodesRef.current.find(item => item.id === nodeId)
      if (!node || node.data.kind !== 'task' || !node.data.task) {
        return
      }

      setTaskAssigner({
        taskNodeId: nodeId,
        selectedAgentNodeId: node.data.task.linkedAgentNodeId ?? '',
        isSaving: false,
        error: null,
      })

      setContextMenu(null)
    },
    [nodesRef, setContextMenu],
  )

  const closeTaskAssigner = useCallback(() => {
    setTaskAssigner(prev => {
      if (!prev || prev.isSaving) {
        return prev
      }

      return null
    })
  }, [])

  const applyTaskAssignment = useCallback(async () => {
    if (!taskAssigner) {
      return
    }

    const selectedAgentNodeId = taskAssigner.selectedAgentNodeId.trim()
    const resolvedSelectedId = selectedAgentNodeId.length > 0 ? selectedAgentNodeId : null

    if (selectedAgentNodeId.length > 0) {
      const selectedAgentNode = nodesRef.current.find(node => node.id === selectedAgentNodeId)
      if (
        !selectedAgentNode ||
        selectedAgentNode.data.kind !== 'agent' ||
        !selectedAgentNode.data.agent
      ) {
        setTaskAssigner(prev =>
          prev
            ? {
                ...prev,
                error: '请选择有效的 Agent。',
              }
            : prev,
        )
        return
      }
    }

    setTaskAssigner(prev =>
      prev
        ? {
            ...prev,
            isSaving: true,
            error: null,
          }
        : prev,
    )

    try {
      setNodes(prevNodes => {
        const targetTask = prevNodes.find(
          node =>
            node.id === taskAssigner.taskNodeId && node.data.kind === 'task' && node.data.task,
        )

        if (!targetTask || targetTask.data.kind !== 'task' || !targetTask.data.task) {
          return prevNodes
        }

        const selectedId = selectedAgentNodeId.length > 0 ? selectedAgentNodeId : null
        const selectedAgentNode = selectedId
          ? prevNodes.find(node => node.id === selectedId && node.data.kind === 'agent')
          : null

        const displacedTaskId = selectedId
          ? (prevNodes.find(node => {
              return (
                node.id !== targetTask.id &&
                node.data.kind === 'task' &&
                node.data.task?.linkedAgentNodeId === selectedId
              )
            })?.id ?? null)
          : null

        const now = new Date().toISOString()

        return prevNodes.map(node => {
          if (node.id === targetTask.id && node.data.kind === 'task' && node.data.task) {
            const nextStatus = selectedId
              ? selectedAgentNode && isAgentWorking(selectedAgentNode.data.status)
                ? 'doing'
                : node.data.task.status
              : node.data.task.status === 'doing'
                ? 'todo'
                : node.data.task.status

            return {
              ...node,
              data: {
                ...node.data,
                task: {
                  ...node.data.task,
                  linkedAgentNodeId: selectedId,
                  status: nextStatus,
                  updatedAt: now,
                },
              },
            }
          }

          if (
            displacedTaskId &&
            node.id === displacedTaskId &&
            node.data.kind === 'task' &&
            node.data.task
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                task: {
                  ...node.data.task,
                  linkedAgentNodeId: null,
                  status: node.data.task.status === 'doing' ? 'todo' : node.data.task.status,
                  updatedAt: now,
                },
              },
            }
          }

          if (node.data.kind === 'agent' && node.data.agent) {
            const shouldAssign = selectedId !== null && node.id === selectedId
            const shouldClear = node.data.agent.taskId === targetTask.id && !shouldAssign

            if (!shouldAssign && !shouldClear) {
              return node
            }

            return {
              ...node,
              data: {
                ...node.data,
                agent: {
                  ...node.data.agent,
                  taskId: shouldAssign ? targetTask.id : null,
                },
              },
            }
          }

          return node
        })
      })

      onRequestPersistFlush?.()

      if (resolvedSelectedId) {
        const taskSpace = spacesRef.current.find(space =>
          space.nodeIds.includes(taskAssigner.taskNodeId),
        )
        if (taskSpace) {
          const nextSpaces = spacesRef.current.map(space => {
            const filtered = space.nodeIds.filter(nodeId => nodeId !== resolvedSelectedId)

            if (space.id !== taskSpace.id) {
              return {
                ...space,
                nodeIds: filtered,
              }
            }

            return {
              ...space,
              nodeIds: [...new Set([...filtered, resolvedSelectedId])],
            }
          })

          onSpacesChange(nextSpaces)
        }
      }

      setTaskAssigner(null)
    } catch (error) {
      setTaskAssigner(prev =>
        prev
          ? {
              ...prev,
              isSaving: false,
              error: `任务分配失败：${toErrorMessage(error)}`,
            }
          : prev,
      )
    }
  }, [onRequestPersistFlush, onSpacesChange, setNodes, spacesRef, taskAssigner, nodesRef])

  useEffect(() => {
    openTaskAssignerRef.current = nodeId => {
      openTaskAssigner(nodeId)
    }
  }, [openTaskAssigner, openTaskAssignerRef])

  return {
    taskAssigner,
    setTaskAssigner,
    closeTaskAssigner,
    applyTaskAssignment,
  }
}
