import React from 'react'
import { MiniMap, type Node } from '@xyflow/react'
import { Map as MapIcon } from 'lucide-react'
import type { TerminalNodeData } from '../../../types'

interface WorkspaceMinimapDockProps {
  isMinimapVisible: boolean
  minimapNodeColor: (node: Node<TerminalNodeData>) => string
  setIsMinimapVisible: React.Dispatch<React.SetStateAction<boolean>>
  onMinimapVisibilityChange: (isVisible: boolean) => void
}

export function WorkspaceMinimapDock({
  isMinimapVisible,
  minimapNodeColor,
  setIsMinimapVisible,
  onMinimapVisibilityChange,
}: WorkspaceMinimapDockProps): React.JSX.Element {
  return (
    <div
      className={`workspace-canvas__minimap-dock${isMinimapVisible ? ' workspace-canvas__minimap-dock--expanded' : ''}`}
    >
      {isMinimapVisible ? (
        <MiniMap
          className="workspace-canvas__minimap"
          pannable
          zoomable
          nodeColor={minimapNodeColor}
          nodeBorderRadius={6}
          maskColor="rgba(73, 132, 255, 0.16)"
        />
      ) : null}

      <button
        type="button"
        className="workspace-canvas__minimap-toggle"
        data-testid="workspace-minimap-toggle"
        aria-label={isMinimapVisible ? 'Hide minimap' : 'Show minimap'}
        title={isMinimapVisible ? 'Hide minimap' : 'Show minimap'}
        onClick={event => {
          event.stopPropagation()
          setIsMinimapVisible(previous => {
            const nextValue = !previous
            onMinimapVisibilityChange(nextValue)
            return nextValue
          })
        }}
      >
        <MapIcon aria-hidden="true" />
      </button>
    </div>
  )
}
