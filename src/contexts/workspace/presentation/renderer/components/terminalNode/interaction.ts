interface TerminalNodeInteraction {
  normalizeViewport: boolean
}

export function resolveTerminalNodeInteraction(
  target: EventTarget | null,
): TerminalNodeInteraction | null {
  if (!(target instanceof Element)) {
    return null
  }

  if (target.closest('.terminal-node__resizer, button, input, textarea, select, a')) {
    return null
  }

  return {
    normalizeViewport: Boolean(target.closest('.terminal-node__terminal')),
  }
}
