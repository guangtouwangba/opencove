import React, { type Dispatch, type SetStateAction } from 'react'
import type { TaskDeleteConfirmationState } from '../types'

interface TaskDeleteConfirmationWindowProps {
  taskDeleteConfirmation: TaskDeleteConfirmationState | null
  setTaskDeleteConfirmation: Dispatch<SetStateAction<TaskDeleteConfirmationState | null>>
  confirmTaskDelete: () => Promise<void>
}

export function TaskDeleteConfirmationWindow({
  taskDeleteConfirmation,
  setTaskDeleteConfirmation,
  confirmTaskDelete,
}: TaskDeleteConfirmationWindowProps): React.JSX.Element | null {
  if (!taskDeleteConfirmation) {
    return null
  }

  return (
    <div
      className="cove-window-backdrop workspace-task-delete-backdrop workspace-task-creator-backdrop"
      onClick={() => {
        setTaskDeleteConfirmation(null)
      }}
    >
      <section
        className="cove-window workspace-task-delete workspace-task-creator"
        data-testid="workspace-task-delete-confirmation"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <h3>Delete Task?</h3>
        <p>
          This will permanently remove <strong>{taskDeleteConfirmation.title}</strong>.
        </p>
        <div className="cove-window__actions workspace-task-delete__actions workspace-task-creator__actions">
          <button
            type="button"
            className="cove-window__action cove-window__action--ghost workspace-task-creator__action workspace-task-creator__action--ghost"
            data-testid="workspace-task-delete-cancel"
            onClick={() => {
              setTaskDeleteConfirmation(null)
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cove-window__action cove-window__action--danger workspace-task-creator__action workspace-task-creator__action--danger"
            data-testid="workspace-task-delete-confirm"
            onClick={() => {
              void confirmTaskDelete()
            }}
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  )
}
