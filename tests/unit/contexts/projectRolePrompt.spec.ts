import { describe, expect, it } from 'vitest'
import { composeProjectRolePrompt } from '../../../src/contexts/workspace/presentation/renderer/components/workspaceCanvas/hooks/useRolePrompt'

describe('composeProjectRolePrompt', () => {
  it('builds a stable prompt from the role template and user input', () => {
    const prompt = composeProjectRolePrompt({
      role: {
        promptTemplate: 'You are a product manager.',
      },
      input: 'Build role chaining.',
    })

    expect(prompt).toBe(
      ['You are a product manager.', 'User input:\nBuild role chaining.'].join('\n\n'),
    )
  })

  it('omits empty user input without changing the role template', () => {
    expect(
      composeProjectRolePrompt({
        role: {
          promptTemplate: 'Implement the requested feature.',
        },
        input: '  ',
      }),
    ).toBe('Implement the requested feature.')
  })
})
