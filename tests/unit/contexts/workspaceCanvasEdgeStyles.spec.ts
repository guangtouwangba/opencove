import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceCanvasCss = readFileSync(
  resolve(process.cwd(), 'src/app/renderer/styles/workspace-canvas.css'),
  'utf8',
)

describe('workspace canvas edge styles', () => {
  it('keeps animated edge strokes scoped to the path so labels do not inherit dash animation', () => {
    expect(workspaceCanvasCss).not.toMatch(
      /(?:^|,)\s*\.workspace-canvas \.workspace-role-agent-edge\s*(?:,|\{)/m,
    )
    expect(workspaceCanvasCss).not.toMatch(
      /(?:^|,)\s*\.workspace-canvas \.workspace-task-agent-edge\s*(?:,|\{)/m,
    )
    expect(workspaceCanvasCss).not.toMatch(
      /(?:^|,)\s*\.workspace-canvas \.workspace-role-agent-edge--active\s*(?:,|\{)/m,
    )
    expect(workspaceCanvasCss).not.toMatch(
      /(?:^|,)\s*\.workspace-canvas \.workspace-task-agent-edge--active\s*(?:,|\{)/m,
    )
    expect(workspaceCanvasCss).toContain(
      '.workspace-canvas .workspace-role-agent-edge--active .react-flow__edge-path',
    )
    expect(workspaceCanvasCss).toContain(
      '.workspace-canvas .workspace-task-agent-edge--active .react-flow__edge-path',
    )
  })
})
