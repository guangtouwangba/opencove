import React from 'react'

export interface SpaceWorktreeGuardState {
  spaceName: string
  agentCount: number
  terminalCount: number
  pendingLabel: string
  allowMarkMismatch: boolean
  isBusy: boolean
  error: string | null
}

export function SpaceWorktreeGuardWindow({
  guard,
  onCancel,
  onMarkMismatchAndContinue,
  onCloseAllAndContinue,
}: {
  guard: SpaceWorktreeGuardState | null
  onCancel: () => void
  onMarkMismatchAndContinue: () => void
  onCloseAllAndContinue: () => void
}): React.JSX.Element | null {
  if (!guard) {
    return null
  }

  const windowSummary = `${guard.agentCount} agent${guard.agentCount === 1 ? '' : 's'} · ${guard.terminalCount} terminal${guard.terminalCount === 1 ? '' : 's'}`

  return (
    <div
      className="cove-window-backdrop workspace-space-worktree-guard-backdrop"
      data-testid="space-worktree-guard"
      onClick={() => {
        if (guard.isBusy) {
          return
        }

        onCancel()
      }}
    >
      <section
        className="cove-window workspace-space-worktree-guard"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <div className="workspace-space-worktree__message-block">
          <h3>{guard.pendingLabel}</h3>
          <p className="workspace-space-worktree__lead">
            Space <strong>{guard.spaceName}</strong> still has active windows bound to its current
            directory.
          </p>
          <p className="workspace-space-worktree__supporting-text">
            {guard.allowMarkMismatch
              ? 'Close them first, or continue by marking those windows as DIR MISMATCH.'
              : 'Close those windows first. This action changes worktree binding and metadata for the space.'}
          </p>
          <p className="workspace-space-worktree-guard__summary">{windowSummary}</p>
        </div>

        {guard.error ? (
          <p className="cove-window__error workspace-space-worktree-guard__error">{guard.error}</p>
        ) : null}

        <div className="cove-window__actions workspace-space-worktree-guard__actions">
          <button
            type="button"
            className="cove-window__action cove-window__action--ghost"
            data-testid="space-worktree-guard-cancel"
            disabled={guard.isBusy}
            onClick={() => {
              onCancel()
            }}
          >
            Cancel
          </button>

          {guard.allowMarkMismatch ? (
            <button
              type="button"
              className="cove-window__action cove-window__action--secondary"
              data-testid="space-worktree-guard-mark-mismatch"
              disabled={guard.isBusy}
              onClick={() => {
                onMarkMismatchAndContinue()
              }}
            >
              Mark Mismatch & Continue
            </button>
          ) : null}

          <button
            type="button"
            className="cove-window__action cove-window__action--danger"
            data-testid="space-worktree-guard-close-all"
            disabled={guard.isBusy}
            onClick={() => {
              onCloseAllAndContinue()
            }}
          >
            Close All & Continue
          </button>
        </div>
      </section>
    </div>
  )
}
