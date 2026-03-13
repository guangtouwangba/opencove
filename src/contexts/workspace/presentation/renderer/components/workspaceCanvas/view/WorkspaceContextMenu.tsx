import React from 'react'
import { ArrowRight, Group, ListTodo, Play, Terminal, X } from 'lucide-react'
import type { ContextMenuState } from '../types'

interface WorkspaceContextMenuProps {
  contextMenu: ContextMenuState | null
  closeContextMenu: () => void
  createTerminalNode: () => Promise<void>
  openTaskCreator: () => void
  openAgentLauncher: () => void
  createSpaceFromSelectedNodes: () => void
  clearNodeSelection: () => void
  canConvertSelectedNoteToTask: boolean
  isConvertSelectedNoteToTaskDisabled: boolean
  convertSelectedNoteToTask: () => void
}

export function WorkspaceContextMenu({
  contextMenu,
  closeContextMenu,
  createTerminalNode,
  openTaskCreator,
  openAgentLauncher,
  createSpaceFromSelectedNodes,
  clearNodeSelection,
  canConvertSelectedNoteToTask,
  isConvertSelectedNoteToTaskDisabled,
  convertSelectedNoteToTask,
}: WorkspaceContextMenuProps): React.JSX.Element | null {
  if (!contextMenu) {
    return null
  }

  return (
    <div
      className="workspace-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
      onClick={event => {
        event.stopPropagation()
      }}
    >
      {contextMenu.kind === 'pane' ? (
        <>
          <button
            type="button"
            data-testid="workspace-context-new-terminal"
            onClick={() => {
              void createTerminalNode()
            }}
          >
            <Terminal className="workspace-context-menu__icon" aria-hidden="true" />
            <span className="workspace-context-menu__label">New Terminal</span>
          </button>
          <button
            type="button"
            data-testid="workspace-context-new-task"
            onClick={() => {
              openTaskCreator()
            }}
          >
            <ListTodo className="workspace-context-menu__icon" aria-hidden="true" />
            <span className="workspace-context-menu__label">New Task</span>
          </button>
          <button
            type="button"
            data-testid="workspace-context-run-default-agent"
            onClick={() => {
              openAgentLauncher()
            }}
          >
            <Play className="workspace-context-menu__icon" aria-hidden="true" />
            <span className="workspace-context-menu__label">Run Agent</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            data-testid="workspace-selection-create-space"
            onClick={() => {
              createSpaceFromSelectedNodes()
            }}
          >
            <Group className="workspace-context-menu__icon" aria-hidden="true" />
            <span className="workspace-context-menu__label">Create Space with Selected</span>
          </button>
          {canConvertSelectedNoteToTask ? (
            <button
              type="button"
              data-testid="workspace-selection-convert-note-to-task"
              disabled={isConvertSelectedNoteToTaskDisabled}
              onClick={() => {
                convertSelectedNoteToTask()
              }}
            >
              <ArrowRight className="workspace-context-menu__icon" aria-hidden="true" />
              <span className="workspace-context-menu__label">Convert to Task</span>
            </button>
          ) : null}
          <button
            type="button"
            data-testid="workspace-selection-clear"
            onClick={() => {
              clearNodeSelection()
              closeContextMenu()
            }}
          >
            <X className="workspace-context-menu__icon" aria-hidden="true" />
            <span className="workspace-context-menu__label">Clear Selection</span>
          </button>
        </>
      )}
    </div>
  )
}
