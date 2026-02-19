import { expect, test } from '@playwright/test'
import { clearAndSeedWorkspace, launchApp, readCanvasViewport } from './workspace-canvas.helpers'

test.describe('Workspace Canvas - Trackpad Gestures', () => {
  test('auto mode switches to trackpad interaction after gesture-like wheel input', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await clearAndSeedWorkspace(window, [
        {
          id: 'auto-trackpad-select-node',
          title: 'terminal-auto-trackpad-select',
          position: { x: 220, y: 180 },
          width: 460,
          height: 300,
        },
      ])

      const pane = window.locator('.workspace-canvas .react-flow__pane')
      await expect(pane).toBeVisible()
      await expect(window.locator('.react-flow__node.selected')).toHaveCount(0)

      await window.evaluate(() => {
        const paneElement = document.querySelector('.workspace-canvas .react-flow__pane')
        if (!(paneElement instanceof HTMLElement)) {
          return
        }

        const dispatch = (deltaX: number, deltaY: number, ctrlKey: boolean): void => {
          paneElement.dispatchEvent(
            new WheelEvent('wheel', {
              deltaX,
              deltaY,
              deltaMode: 0,
              ctrlKey,
              bubbles: true,
              cancelable: true,
            }),
          )
        }

        dispatch(0, 2, true)
        dispatch(1.1, 1.8, false)
        dispatch(1, 1.5, false)
      })

      await pane.dragTo(pane, {
        sourcePosition: { x: 80, y: 80 },
        targetPosition: { x: 760, y: 560 },
      })

      await expect(window.locator('.react-flow__node.selected')).toHaveCount(1)
    } finally {
      await electronApp.close()
    }
  })

  test('locks trackpad pan target to canvas across contiguous wheel gestures', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await clearAndSeedWorkspace(
        window,
        [
          {
            id: 'trackpad-pan-lock-node',
            title: 'terminal-trackpad-pan-lock',
            position: { x: 320, y: 260 },
            width: 460,
            height: 300,
          },
        ],
        {
          settings: {
            canvasInputMode: 'trackpad',
          },
        },
      )

      const pane = window.locator('.workspace-canvas .react-flow__pane')
      const terminal = window.locator('.terminal-node').first()
      await expect(pane).toBeVisible()
      await expect(terminal).toBeVisible()
      const paneBox = await pane.boundingBox()
      if (!paneBox) {
        throw new Error('workspace pane bounding box unavailable')
      }
      const terminalBox = await terminal.boundingBox()
      if (!terminalBox) {
        throw new Error('terminal node bounding box unavailable')
      }

      const before = await readCanvasViewport(window)

      await window.mouse.move(paneBox.x + 120, paneBox.y + 120)
      await window.mouse.wheel(120, 0)

      await window.mouse.move(terminalBox.x + 80, terminalBox.y + 80)
      await window.mouse.wheel(120, 0)

      await expect
        .poll(async () => {
          const current = await readCanvasViewport(window)
          return Math.abs(current.x - before.x)
        })
        .toBeGreaterThan(80)
    } finally {
      await electronApp.close()
    }
  })

  test('restores terminal wheel scrolling after a trackpad pan gesture gap', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await clearAndSeedWorkspace(
        window,
        [
          {
            id: 'trackpad-terminal-scroll-after-pan',
            title: 'terminal-trackpad-scroll-after-pan',
            position: { x: 240, y: 200 },
            width: 520,
            height: 320,
          },
        ],
        {
          settings: {
            canvasInputMode: 'trackpad',
          },
        },
      )

      const pane = window.locator('.workspace-canvas .react-flow__pane')
      const terminal = window.locator('.terminal-node').first()
      await expect(pane).toBeVisible()
      await expect(terminal).toBeVisible()

      const xterm = terminal.locator('.xterm')
      await expect(xterm).toBeVisible()
      await xterm.click()
      const terminalInput = terminal.locator('.xterm-helper-textarea')
      await expect(terminalInput).toBeFocused()
      await window.keyboard.type('for i in $(seq 1 260); do echo TRACKPAD_SCROLL_$i; done')
      await window.keyboard.press('Enter')
      await expect(terminal).toContainText('TRACKPAD_SCROLL_260')

      await window.evaluate(() => {
        const paneElement = document.querySelector('.workspace-canvas .react-flow__pane')
        if (!(paneElement instanceof HTMLElement)) {
          return
        }

        paneElement.dispatchEvent(
          new WheelEvent('wheel', {
            deltaX: 160,
            deltaY: 24,
            deltaMode: 0,
            bubbles: true,
            cancelable: true,
          }),
        )
      })

      await window.waitForTimeout(280)

      const visibleRows = terminal.locator('.xterm-rows')
      const beforeRows = await visibleRows.innerText()

      await terminal.hover()
      await window.mouse.wheel(0, -900)
      await window.waitForTimeout(120)

      const afterRows = await visibleRows.innerText()
      expect(afterRows).not.toBe(beforeRows)
    } finally {
      await electronApp.close()
    }
  })

  test('uses pointer location as zoom anchor for trackpad pinch', async () => {
    const { electronApp, window } = await launchApp()

    try {
      await clearAndSeedWorkspace(
        window,
        [
          {
            id: 'trackpad-pinch-anchor-node',
            title: 'terminal-trackpad-pinch-anchor',
            position: { x: 420, y: 300 },
            width: 520,
            height: 320,
          },
        ],
        {
          settings: {
            canvasInputMode: 'trackpad',
          },
        },
      )

      const pane = window.locator('.workspace-canvas .react-flow__pane')
      await expect(pane).toBeVisible()

      const initialViewport = await readCanvasViewport(window)

      const invariants = await window.evaluate(initial => {
        const paneElement = document.querySelector('.workspace-canvas .react-flow__pane')
        if (!(paneElement instanceof HTMLElement)) {
          return null
        }

        const rect = paneElement.getBoundingClientRect()
        const anchorClientX = rect.left + rect.width * 0.82
        const anchorClientY = rect.top + rect.height * 0.26
        const anchorLocalX = anchorClientX - rect.left
        const anchorLocalY = anchorClientY - rect.top

        const flowBefore = {
          x: (anchorLocalX - initial.x) / initial.zoom,
          y: (anchorLocalY - initial.y) / initial.zoom,
        }

        paneElement.dispatchEvent(
          new WheelEvent('wheel', {
            deltaX: 0,
            deltaY: -120,
            deltaMode: 0,
            ctrlKey: true,
            clientX: anchorClientX,
            clientY: anchorClientY,
            bubbles: true,
            cancelable: true,
          }),
        )

        return {
          anchorLocalX,
          anchorLocalY,
          flowBefore,
        }
      }, initialViewport)

      if (!invariants) {
        throw new Error('workspace pane element unavailable for pinch anchor test')
      }

      const nextViewport = await readCanvasViewport(window)
      expect(nextViewport.zoom).toBeGreaterThan(initialViewport.zoom)

      const flowAfter = {
        x: (invariants.anchorLocalX - nextViewport.x) / nextViewport.zoom,
        y: (invariants.anchorLocalY - nextViewport.y) / nextViewport.zoom,
      }

      expect(Math.abs(flowAfter.x - invariants.flowBefore.x)).toBeLessThan(0.6)
      expect(Math.abs(flowAfter.y - invariants.flowBefore.y)).toBeLessThan(0.6)
    } finally {
      await electronApp.close()
    }
  })
})
