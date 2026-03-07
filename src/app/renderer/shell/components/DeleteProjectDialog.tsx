import React from 'react'

export function DeleteProjectDialog({
  workspaceName,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  workspaceName: string
  isRemoving: boolean
  onCancel: () => void
  onConfirm: () => void
}): React.JSX.Element {
  return (
    <div
      className="cove-window-backdrop workspace-task-delete-backdrop workspace-task-creator-backdrop"
      onClick={() => {
        if (isRemoving) {
          return
        }

        onCancel()
      }}
    >
      <section
        className="cove-window workspace-task-delete workspace-task-creator"
        data-testid="workspace-project-delete-confirmation"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <h3>Remove Project?</h3>
        <p>
          This will close all terminals and agents in <strong>{workspaceName}</strong>.
        </p>
        <div className="cove-window__actions workspace-task-delete__actions workspace-task-creator__actions">
          <button
            type="button"
            className="cove-window__action cove-window__action--ghost workspace-task-creator__action workspace-task-creator__action--ghost"
            data-testid="workspace-project-delete-cancel"
            disabled={isRemoving}
            onClick={() => {
              onCancel()
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cove-window__action cove-window__action--danger workspace-task-creator__action workspace-task-creator__action--danger"
            data-testid="workspace-project-delete-confirm"
            disabled={isRemoving}
            onClick={() => {
              onConfirm()
            }}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </section>
    </div>
  )
}
