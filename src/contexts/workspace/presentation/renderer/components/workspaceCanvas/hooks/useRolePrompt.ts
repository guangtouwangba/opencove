import type { ProjectRoleDefinition } from '@contexts/settings/domain/projectRoles'

export function composeProjectRolePrompt({
  role,
  input,
}: {
  role: Pick<ProjectRoleDefinition, 'promptTemplate'>
  input: string
}): string {
  const sections = [role.promptTemplate.trim()].filter(Boolean)
  const userInput = input.trim()

  if (userInput.length > 0) {
    sections.push(`User input:\n${userInput}`)
  }

  return sections.join('\n\n')
}
