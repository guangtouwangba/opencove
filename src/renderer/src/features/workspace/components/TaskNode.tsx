import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX, PointerEvent as ReactPointerEvent } from 'react'
import type { Size, TaskRuntimeStatus } from '../types'

interface TaskNodeProps {
  title: string
  requirement: string
  status: TaskRuntimeStatus
  width: number
  height: number
  onClose: () => void
  onEdit: () => void
  onRunAgent: () => void
  onResize: (size: Size) => void
  onStatusChange: (status: TaskRuntimeStatus) => void
}

type ResizeAxis = 'horizontal' | 'vertical'

const MIN_WIDTH = 320
const MIN_HEIGHT = 220

const TASK_STATUS_OPTIONS: Array<{ value: TaskRuntimeStatus; label: string }> = [
  { value: 'todo', label: 'TODO' },
  { value: 'doing', label: 'DOING' },
  { value: 'ai_done', label: 'AI_DONE' },
  { value: 'done', label: 'DONE' },
]

export function TaskNode({
  title,
  requirement,
  status,
  width,
  height,
  onClose,
  onEdit,
  onRunAgent,
  onResize,
  onStatusChange,
}: TaskNodeProps): JSX.Element {
  const resizeStartRef = useRef<{
    x: number
    y: number
    width: number
    height: number
    axis: ResizeAxis
  } | null>(null)
  const draftSizeRef = useRef<Size | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [draftSize, setDraftSize] = useState<Size | null>(null)

  useEffect(() => {
    draftSizeRef.current = draftSize
  }, [draftSize])

  useEffect(() => {
    if (!draftSize || isResizing) {
      return
    }

    if (draftSize.width === width && draftSize.height === height) {
      setDraftSize(null)
    }
  }, [draftSize, height, isResizing, width])

  const handleResizePointerDown = useCallback(
    (axis: ResizeAxis) => (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)

      resizeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        width,
        height,
        axis,
      }

      setDraftSize({ width, height })
      setIsResizing(true)
    },
    [height, width],
  )

  useEffect(() => {
    if (!isResizing) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const start = resizeStartRef.current
      if (!start) {
        return
      }

      if (start.axis === 'horizontal') {
        const nextWidth = Math.max(MIN_WIDTH, Math.round(start.width + (event.clientX - start.x)))
        setDraftSize({ width: nextWidth, height: start.height })
        return
      }

      const nextHeight = Math.max(MIN_HEIGHT, Math.round(start.height + (event.clientY - start.y)))
      setDraftSize({ width: start.width, height: nextHeight })
    }

    const handlePointerUp = () => {
      setIsResizing(false)

      const finalSize = draftSizeRef.current ?? { width, height }
      onResize(finalSize)

      resizeStartRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [height, isResizing, onResize, width])

  const renderedSize = draftSize ?? { width, height }
  const style = useMemo(
    () => ({ width: renderedSize.width, height: renderedSize.height }),
    [renderedSize.height, renderedSize.width],
  )

  return (
    <div
      className="task-node nowheel"
      style={style}
      onWheel={event => {
        event.stopPropagation()
      }}
    >
      <div className="task-node__header" data-node-drag-handle="true">
        <span
          className="task-node__title"
          onDoubleClick={event => {
            event.stopPropagation()
            onEdit()
          }}
        >
          {title}
        </span>
        <button
          type="button"
          className="task-node__close nodrag"
          onClick={event => {
            event.stopPropagation()
            onClose()
          }}
        >
          ×
        </button>
      </div>

      <div
        className="task-node__content"
        onDoubleClick={event => {
          event.stopPropagation()
          onEdit()
        }}
      >
        <label>Task Requirement</label>
        <p>{requirement}</p>
      </div>

      <div className="task-node__footer nodrag">
        <select
          data-testid="task-node-status-select"
          value={status}
          onChange={event => {
            onStatusChange(event.target.value as TaskRuntimeStatus)
          }}
        >
          {TASK_STATUS_OPTIONS.map(option => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="task-node__edit"
          data-testid="task-node-edit"
          onClick={event => {
            event.stopPropagation()
            onEdit()
          }}
        >
          Edit
        </button>

        <button
          type="button"
          className="task-node__run-agent"
          data-testid="task-node-run-agent"
          onClick={event => {
            event.stopPropagation()
            onRunAgent()
          }}
        >
          Run Agent
        </button>
      </div>

      <button
        type="button"
        className="task-node__resizer task-node__resizer--right nodrag"
        onPointerDown={handleResizePointerDown('horizontal')}
        aria-label="Resize task width"
        data-testid="task-resizer-right"
      />
      <button
        type="button"
        className="task-node__resizer task-node__resizer--bottom nodrag"
        onPointerDown={handleResizePointerDown('vertical')}
        aria-label="Resize task height"
        data-testid="task-resizer-bottom"
      />
    </div>
  )
}
