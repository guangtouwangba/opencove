import type { JSX } from 'react'
import type { AgentRuntimeStatus, WorkspaceNodeKind } from '../../types'
import { getStatusClassName, getStatusLabel } from './status'

interface TerminalNodeHeaderProps {
  title: string
  kind: WorkspaceNodeKind
  status: AgentRuntimeStatus | null
  onClose: () => void
  onStop?: () => void
  onRerun?: () => void
  onResume?: () => void
}

export function TerminalNodeHeader({
  title,
  kind,
  status,
  onClose,
  onStop,
  onRerun,
  onResume,
}: TerminalNodeHeaderProps): JSX.Element {
  const isAgentNode = kind === 'agent'
  const canStop =
    isAgentNode &&
    (status === 'running' || status === 'restoring' || status === null) &&
    typeof onStop === 'function'

  return (
    <div className="terminal-node__header" data-node-drag-handle="true">
      <span className="terminal-node__title">{title}</span>

      {isAgentNode ? (
        <div className="terminal-node__agent-controls nodrag">
          <span className={`terminal-node__status ${getStatusClassName(status)}`}>
            {getStatusLabel(status)}
          </span>
          <button
            type="button"
            className="terminal-node__action"
            disabled={!canStop}
            onClick={event => {
              event.stopPropagation()
              onStop?.()
            }}
          >
            Stop
          </button>
          <button
            type="button"
            className="terminal-node__action"
            disabled={typeof onRerun !== 'function'}
            onClick={event => {
              event.stopPropagation()
              onRerun?.()
            }}
          >
            Rerun
          </button>
          <button
            type="button"
            className="terminal-node__action"
            disabled={typeof onResume !== 'function'}
            onClick={event => {
              event.stopPropagation()
              onResume?.()
            }}
          >
            Resume
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className="terminal-node__close nodrag"
        onClick={event => {
          event.stopPropagation()
          onClose()
        }}
      >
        ×
      </button>
    </div>
  )
}
