import { useCallback, type MutableRefObject } from 'react'
import type { Viewport } from '@xyflow/react'
import type { ReactFlowInstance } from '@xyflow/react'
import {
  inferCanvasInputModalityFromWheel,
  type CanvasInputModalityState,
  type DetectedCanvasInputMode,
} from '../../../utils/inputModality'
import {
  MAX_CANVAS_ZOOM,
  MIN_CANVAS_ZOOM,
  TRACKPAD_GESTURE_LOCK_GAP_MS,
  TRACKPAD_PAN_SCROLL_SPEED,
  TRACKPAD_PINCH_SENSITIVITY,
} from '../constants'
import { clampNumber, resolveWheelAction, resolveWheelTarget } from '../helpers'
import type { TrackpadGestureLockState } from '../types'

interface UseTrackpadGesturesParams {
  canvasInputModeSetting: 'mouse' | 'trackpad' | 'auto'
  resolvedCanvasInputMode: DetectedCanvasInputMode
  inputModalityStateRef: MutableRefObject<CanvasInputModalityState>
  setDetectedCanvasInputMode: React.Dispatch<React.SetStateAction<DetectedCanvasInputMode>>
  canvasRef: MutableRefObject<HTMLDivElement | null>
  trackpadGestureLockRef: MutableRefObject<TrackpadGestureLockState | null>
  viewportRef: MutableRefObject<Viewport>
  reactFlow: ReactFlowInstance
  onViewportChange: (viewport: { x: number; y: number; zoom: number }) => void
}

export function useWorkspaceCanvasTrackpadGestures({
  canvasInputModeSetting,
  resolvedCanvasInputMode,
  inputModalityStateRef,
  setDetectedCanvasInputMode,
  canvasRef,
  trackpadGestureLockRef,
  viewportRef,
  reactFlow,
  onViewportChange,
}: UseTrackpadGesturesParams): { handleCanvasWheelCapture: (event: WheelEvent) => void } {
  const handleCanvasWheelCapture = useCallback(
    (event: WheelEvent) => {
      let effectiveMode = resolvedCanvasInputMode
      const wheelTarget = resolveWheelTarget(event.target)

      if (canvasInputModeSetting === 'auto' && (wheelTarget === 'canvas' || event.ctrlKey)) {
        const nextState = inferCanvasInputModalityFromWheel(inputModalityStateRef.current, {
          deltaX: event.deltaX,
          deltaY: event.deltaY,
          deltaMode: event.deltaMode,
          ctrlKey: event.ctrlKey,
          timeStamp: event.timeStamp,
        })

        inputModalityStateRef.current = nextState
        setDetectedCanvasInputMode(previous =>
          previous === nextState.mode ? previous : nextState.mode,
        )
        effectiveMode = nextState.mode
      }

      if (effectiveMode !== 'trackpad') {
        trackpadGestureLockRef.current = null
        return
      }

      const action = resolveWheelAction(event.ctrlKey)
      const lockTimestamp = performance.now()
      const activeLock = trackpadGestureLockRef.current
      const previousLock =
        activeLock !== null &&
        lockTimestamp - activeLock.lastTimestamp <= TRACKPAD_GESTURE_LOCK_GAP_MS
          ? activeLock
          : null

      if (activeLock !== null && previousLock === null) {
        trackpadGestureLockRef.current = null
      }

      const canvasElement = canvasRef.current
      const isEventFromCanvas =
        canvasElement !== null &&
        event.target instanceof Node &&
        canvasElement.contains(event.target)
      const canContinueCanvasLock =
        previousLock !== null && previousLock.action === action && previousLock.target === 'canvas'

      if (!isEventFromCanvas && !canContinueCanvasLock) {
        return
      }

      const target = isEventFromCanvas ? wheelTarget : 'canvas'
      const isContinuousGesture = previousLock !== null && previousLock.action === action
      const lockedTarget = isContinuousGesture ? previousLock.target : target

      trackpadGestureLockRef.current = {
        action,
        target: lockedTarget,
        lastTimestamp: lockTimestamp,
      }

      if (lockedTarget !== 'canvas') {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const currentViewport = viewportRef.current

      if (action === 'pan') {
        const nextViewport = {
          x: currentViewport.x - event.deltaX * TRACKPAD_PAN_SCROLL_SPEED,
          y: currentViewport.y - event.deltaY * TRACKPAD_PAN_SCROLL_SPEED,
          zoom: currentViewport.zoom,
        }

        viewportRef.current = nextViewport
        reactFlow.setViewport(nextViewport, { duration: 0 })
        onViewportChange(nextViewport)
        return
      }

      const zoomFactor = Math.exp(-event.deltaY * TRACKPAD_PINCH_SENSITIVITY)
      const nextZoom = clampNumber(
        currentViewport.zoom * zoomFactor,
        MIN_CANVAS_ZOOM,
        MAX_CANVAS_ZOOM,
      )

      if (Math.abs(nextZoom - currentViewport.zoom) < 0.0001) {
        return
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect()
      const anchorLocalX =
        canvasRect && Number.isFinite(canvasRect.left)
          ? event.clientX - canvasRect.left
          : event.clientX
      const anchorLocalY =
        canvasRect && Number.isFinite(canvasRect.top)
          ? event.clientY - canvasRect.top
          : event.clientY

      const anchorFlow = {
        x: (anchorLocalX - currentViewport.x) / currentViewport.zoom,
        y: (anchorLocalY - currentViewport.y) / currentViewport.zoom,
      }

      const nextViewport = {
        x: anchorLocalX - anchorFlow.x * nextZoom,
        y: anchorLocalY - anchorFlow.y * nextZoom,
        zoom: nextZoom,
      }

      viewportRef.current = nextViewport
      reactFlow.setViewport(nextViewport, { duration: 0 })
      onViewportChange(nextViewport)
    },
    [
      canvasInputModeSetting,
      canvasRef,
      inputModalityStateRef,
      onViewportChange,
      reactFlow,
      resolvedCanvasInputMode,
      setDetectedCanvasInputMode,
      trackpadGestureLockRef,
      viewportRef,
    ],
  )

  return { handleCanvasWheelCapture }
}
