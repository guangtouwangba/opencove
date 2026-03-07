import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { MIN_HEIGHT, MIN_WIDTH, type ResizeAxis } from './constants'

export function useTerminalResize({
  width,
  height,
  onResize,
  syncTerminalSize,
  scheduleScrollbackPublish,
  isPointerResizingRef,
}: {
  width: number
  height: number
  onResize: (size: { width: number; height: number }) => void
  syncTerminalSize: () => void
  scheduleScrollbackPublish: (force?: boolean) => void
  isPointerResizingRef: React.MutableRefObject<boolean>
}): {
  draftSize: { width: number; height: number } | null
  handleResizePointerDown: (
    axis: ResizeAxis,
  ) => (event: ReactPointerEvent<HTMLButtonElement>) => void
} {
  const resizeStartRef = useRef<{
    x: number
    y: number
    width: number
    height: number
    axis: ResizeAxis
  } | null>(null)
  const draftSizeRef = useRef<{ width: number; height: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [draftSize, setDraftSize] = useState<{ width: number; height: number } | null>(null)

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

      isPointerResizingRef.current = true
      setDraftSize({ width, height })
      setIsResizing(true)
    },
    [height, isPointerResizingRef, width],
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
      isPointerResizingRef.current = false

      const finalSize = draftSizeRef.current ?? { width, height }
      onResize(finalSize)

      resizeStartRef.current = null
      requestAnimationFrame(() => {
        syncTerminalSize()
        scheduleScrollbackPublish(true)
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [
    height,
    isPointerResizingRef,
    isResizing,
    onResize,
    scheduleScrollbackPublish,
    syncTerminalSize,
    width,
  ])

  return { draftSize, handleResizePointerDown }
}
