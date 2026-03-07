import React, { type Dispatch, type SetStateAction } from 'react'
import { toAgentRuntimeLabel } from '../helpers'
import type { TaskAssignerState } from '../types'
import type { TerminalNodeData } from '../../../types'

interface TaskAssignerAgentOption {
  nodeId: string
  title: string
  status: TerminalNodeData['status']
  linkedTaskTitle: string | null
}

interface TaskAssignerWindowProps {
  taskAssigner: TaskAssignerState | null
  activeTaskTitle: string | null
  agentOptions: TaskAssignerAgentOption[]
  setTaskAssigner: Dispatch<SetStateAction<TaskAssignerState | null>>
  closeTaskAssigner: () => void
  applyTaskAssignment: () => Promise<void>
}

export function TaskAssignerWindow({
  taskAssigner,
  activeTaskTitle,
  agentOptions,
  setTaskAssigner,
  closeTaskAssigner,
  applyTaskAssignment,
}: TaskAssignerWindowProps): React.JSX.Element | null {
  if (!taskAssigner) {
    return null
  }

  return (
    <div
      className="cove-window-backdrop workspace-task-creator-backdrop"
      onClick={() => {
        closeTaskAssigner()
      }}
    >
      <section
        className="cove-window workspace-task-creator workspace-task-assigner"
        data-testid="workspace-task-assigner"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <h3>Assign Agent</h3>
        <p className="workspace-task-creator__meta">Task: {activeTaskTitle ?? 'Unknown task'}</p>

        <div className="workspace-task-creator__field-row">
          <label htmlFor="workspace-task-assign-select">Linked Agent</label>
          <select
            id="workspace-task-assign-select"
            data-testid="workspace-task-assign-select"
            value={taskAssigner.selectedAgentNodeId}
            disabled={taskAssigner.isSaving}
            onChange={event => {
              const nextAgentNodeId = event.target.value
              setTaskAssigner(prev =>
                prev
                  ? {
                      ...prev,
                      selectedAgentNodeId: nextAgentNodeId,
                      error: null,
                    }
                  : prev,
              )
            }}
          >
            <option value="">Unassigned</option>
            {agentOptions.map(option => {
              const statusLabel = toAgentRuntimeLabel(option.status)
              const currentTaskLabel = option.linkedTaskTitle ? ` · ${option.linkedTaskTitle}` : ''

              return (
                <option value={option.nodeId} key={option.nodeId}>
                  {`${option.title} (${statusLabel})${currentTaskLabel}`}
                </option>
              )
            })}
          </select>
        </div>

        {taskAssigner.error ? (
          <p className="cove-window__error workspace-task-creator__error">{taskAssigner.error}</p>
        ) : null}

        <div className="cove-window__actions workspace-task-creator__actions">
          <button
            type="button"
            className="cove-window__action cove-window__action--ghost workspace-task-creator__action workspace-task-creator__action--ghost"
            data-testid="workspace-task-assign-cancel"
            disabled={taskAssigner.isSaving}
            onClick={() => {
              closeTaskAssigner()
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cove-window__action cove-window__action--primary workspace-task-creator__action workspace-task-creator__action--primary"
            data-testid="workspace-task-assign-submit"
            disabled={taskAssigner.isSaving}
            onClick={() => {
              void applyTaskAssignment()
            }}
          >
            {taskAssigner.isSaving ? 'Saving...' : 'Apply'}
          </button>
        </div>
      </section>
    </div>
  )
}
