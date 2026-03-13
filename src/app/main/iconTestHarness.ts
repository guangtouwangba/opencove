type RuntimeIconTestState = {
  runtimeIconPath: string | null
}

declare global {
  var __opencoveRuntimeIconTestState: RuntimeIconTestState | undefined
}

export function setRuntimeIconTestState(runtimeIconPath: string | null): void {
  globalThis.__opencoveRuntimeIconTestState = {
    runtimeIconPath,
  }
}
