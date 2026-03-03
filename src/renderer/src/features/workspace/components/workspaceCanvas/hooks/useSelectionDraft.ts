import { useCallback, type MutableRefObject } from 'react'
import type { Node } from '@xyflow/react'
import type { ReactFlowInstance } from '@xyflow/react'
import type { TerminalNodeData } from '../../../types'
import type { ContextMenuState, EmptySelectionPromptState, SelectionDraftState } from '../types'

interface UseSelectionDraftParams {
  isTrackpadCanvasMode: boolean
  isShiftPressedRef: MutableRefObject<boolean>
  selectionDraftRef: MutableRefObject<SelectionDraftState | null>
  reactFlow: ReactFlowInstance<Node<TerminalNodeData>>
  setNodes: (
    updater: (prevNodes: Node<TerminalNodeData>[]) => Node<TerminalNodeData>[],
    options?: { syncLayout?: boolean },
  ) => void
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>
  setEmptySelectionPrompt: React.Dispatch<React.SetStateAction<EmptySelectionPromptState | null>>
}

export function useWorkspaceCanvasSelectionDraft({
  isTrackpadCanvasMode,
  isShiftPressedRef,
  selectionDraftRef,
  reactFlow,
  setNodes,
  setSelectedNodeIds,
  setContextMenu,
  setEmptySelectionPrompt,
}: UseSelectionDraftParams): {
  handleCanvasPointerDownCapture: (event: React.PointerEvent<HTMLDivElement>) => void
  handleCanvasPointerMoveCapture: (event: React.PointerEvent<HTMLDivElement>) => void
  handleCanvasPointerUpCapture: () => void
} {
  const selectNodesInDraftRect = useCallback(
    (draft: SelectionDraftState) => {
      const start = reactFlow.screenToFlowPosition({
        x: draft.startX,
        y: draft.startY,
      })
      const end = reactFlow.screenToFlowPosition({
        x: draft.currentX,
        y: draft.currentY,
      })

      const left = Math.min(start.x, end.x)
      const right = Math.max(start.x, end.x)
      const top = Math.min(start.y, end.y)
      const bottom = Math.max(start.y, end.y)

      const selectedAtStart = draft.additive
        ? new Set(draft.selectedNodeIdsAtStart)
        : new Set<string>()
      const selectedIds: string[] = []

      setNodes(
        previousNodes => {
          let hasChanged = false

          const nextNodes = previousNodes.map(node => {
            const nodeLeft = node.position.x
            const nodeRight = node.position.x + node.data.width
            const nodeTop = node.position.y
            const nodeBottom = node.position.y + node.data.height
            const intersects =
              nodeLeft <= right && nodeRight >= left && nodeTop <= bottom && nodeBottom >= top
            const isSelected = draft.additive
              ? selectedAtStart.has(node.id) || intersects
              : intersects

            if (isSelected) {
              selectedIds.push(node.id)
            }

            if (node.selected === isSelected) {
              return node
            }

            hasChanged = true
            return {
              ...node,
              selected: isSelected,
            }
          })

          return hasChanged ? nextNodes : previousNodes
        },
        { syncLayout: false },
      )

      setSelectedNodeIds(selectedIds)
    },
    [reactFlow, setNodes, setSelectedNodeIds],
  )

  const handleCanvasPointerDownCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const canStartBoxSelection =
        isTrackpadCanvasMode || event.shiftKey || isShiftPressedRef.current

      if (event.button !== 0 || !canStartBoxSelection) {
        return
      }

      if (!(event.target instanceof Element)) {
        return
      }

      if (event.target.closest('.react-flow__node')) {
        return
      }

      if (
        !event.target.closest('.react-flow__pane') &&
        !event.target.closest('.react-flow__renderer')
      ) {
        return
      }

      selectionDraftRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        additive: event.shiftKey || isShiftPressedRef.current,
        selectedNodeIdsAtStart: reactFlow
          .getNodes()
          .filter(node => Boolean(node.selected))
          .map(node => node.id),
      }
      setContextMenu(null)
      setEmptySelectionPrompt(null)
    },
    [
      isShiftPressedRef,
      isTrackpadCanvasMode,
      reactFlow,
      selectionDraftRef,
      setContextMenu,
      setEmptySelectionPrompt,
    ],
  )

  const handleCanvasPointerMoveCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const draft = selectionDraftRef.current
      if (!draft) {
        return
      }

      draft.currentX = event.clientX
      draft.currentY = event.clientY
    },
    [selectionDraftRef],
  )

  const handleCanvasPointerUpCapture = useCallback(() => {
    const draft = selectionDraftRef.current
    if (!draft) {
      return
    }

    selectionDraftRef.current = null
    const width = Math.abs(draft.currentX - draft.startX)
    const height = Math.abs(draft.currentY - draft.startY)
    if (width < 8 || height < 8) {
      return
    }

    window.requestAnimationFrame(() => {
      selectNodesInDraftRect(draft)
      setEmptySelectionPrompt(null)
    })
  }, [selectNodesInDraftRect, selectionDraftRef, setEmptySelectionPrompt])

  return {
    handleCanvasPointerDownCapture,
    handleCanvasPointerMoveCapture,
    handleCanvasPointerUpCapture,
  }
}
