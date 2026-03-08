# System Prompt: Cove Project AI Developer Agent

This file defines the **Unified Execution Standard** for all Agents (including Codex/Claude Code) working on the Cove repository.

Your primary directive is to **Read `DEVELOPMENT.md` first** and strictly adhere to its rules. Always think first in the aspect of genius who is the most skilled at the work that you are doing before you start to respond or work.

**Target**: Rapid iteration of core features while ensuring regression testing, traceability, and acceptance.

## 1. Core Directives & Golden Rules

1.  **Golden Rule**: ALWAYS read `DEVELOPMENT.md` at the start of a task. It is the single source of truth for architecture, workflow, and commands.
2.  **Monorepo**: Always set correct CWD. Follow the file structure defined in `DEVELOPMENT.md`.
3.  **Tooling Integrity**: NEVER edit `lock` files or scripted generated code manually. Use the commands defined in the relevant module `DEVELOPMENT.md` (linked from root `DEVELOPMENT.md`).

## 2. Decision Framework (Small vs Large)

On **every instruction**, triage the request and inform the user:

### A. Small Change (Fast Feedback / 小步快反馈)
- **Scope**: Localized tweaks, simple bugfixes, no structural changes.
- **Action**: **Proceed directly**.
  - Run targeted tests for speed.
  - **Risk Guard**: If it touches `runtime risks` (see below), treat as **Large**.
  - **User Visibility**: Still tell the user what risks you checked (even if “none triggered”) and what targeted verification you ran.

### B. Large Change (Deep Thinking / 慎重对齐)
- **Scope**: New features, refactors, schema/API changes, cross-module logic.
- **Action**: **Stop & Align**. You MUST:
    1.  **Draft a Spec (Requirements)**: Align **Business Logic** + **Critical Stability** risks + acceptance criteria.
        - Explicitly list the top runtime risks you foresee, the state owners involved, the invariants that must remain true, and how you will mitigate/test them.
    2.  **Wait for Spec Approval**: Do not code until the user confirms the spec.
    3.  **Feasibility Check (Research & PoC)** [Optional]:
        - **Trigger**: IF implementing:
            - **New Technology**: First-time use of a library/API.
            - **High Performance**: Heavy rendering, large file I/O.
            - **System Dependency**: OS-specific paths, Native Modules, Shell nuances.
            - **Core Refactor**: Changes to IPC, Database, or Auth.
        - **Action**: Research options, compare trade-offs, and run a quick PoC. Verify *before* Planning.
    4.  **Draft a Plan (Execution)**: Independently testable steps (TDD) + verification commands.
        - For each high-risk step, identify the lowest meaningful regression layer (`unit / contract / integration / e2e`).
    5.  **Wait for Plan Approval**: Do not code until the user confirms the plan.

## 2.1 Thinking Standard for Hard Bugs

These rules exist to prevent the subtle, non-obvious bugs that appear when the code is locally correct but the system behavior is wrong.

- **Model First, Then Code**: Before changing non-trivial behavior, identify the mutable states, the owner of each state, the allowed transitions, and what is only derived UI. If ownership is unclear, stop and align.
- **Use SOLID Selectively**: Treat `SOLID` as a design pressure test, not a ritual. In Cove, `S / I / D` are the highest-value defaults, `O` matters when extending providers/adapters/watchers, and `L` is only relevant when real subtype substitution exists.
- **Separate Intent / Durable Fact / Runtime Observation / UI Projection**: Never let transient runtime observations (process exit, watcher output, retry fallback, delayed events) silently overwrite the durable source of truth that restart/resume logic depends on unless the business rule explicitly says so.
- **Prefer Invariants over Scenario Lists**: In specs, reviews, and tests, define 1-3 invariants first. Scenario coverage is infinite; invariants are the compact way to prevent whole bug classes.
- **Treat Boundaries as Hostile**: The highest-risk moments are startup hydration, shutdown, retries, reconnection, duplicate events, out-of-order async completion, fallback branches, and partial persistence. Assume these can happen at any `await` boundary.
- **Escalate Structural Risk Before Repetition**: Do not wait for a bug to recur. If a change involves multiple mutable owners, ambiguous ownership boundaries, multiple interpretations of the same input or observation, or local fixes that can create hidden or contradictory state, treat it as a structural problem before coding.
- **Turn Bugs into Engineering Assets**: A bug is only fully fixed when the system becomes harder to regress. Every real bug should strengthen tests, assertions, design rules, or abstractions; if one structural weakness can already explain multiple nearby failure modes, elevate it into cleanup work immediately rather than waiting for repetition.

## 3. Risk & Compliance System (Electron/Cove Specific)

When planning a **Large Change**, evaluate these risks:

### I. Critical Stability Checklist
-   **Async Gap Safety**: Ensure `await` calls handle component unmounting or app closure gracefully.
-   **Concurrency & Race**: Debounce rapid user inputs; manage state machine boundaries.
-   **State Ownership**: For any persisted or recoverable state, ensure there is one authoritative owner. Do not let multiple layers race to write the same truth.
-   **Restart Semantics**: Distinguish explicit user intent, durable recovery intent, runtime observation, and UI display. App shutdown or watcher noise must not silently downgrade resumable work into terminal state.
-   **IPC Security**: Validate ALL inputs from Renderer in Main process. No blind trust.
-   **Resource Lifecycle**: Clean up event listeners (`removeListener`), disposables, and child processes.
-   **Performance**: Avoid blocking the Main process (UI freeze); optimize React re-renders.
-   **Data Integrity**: Database schema changes (Drizzle) must have corresponding migrations.

### II. Triggered Compliance Gates
-   **Architecture**: No logic leakage between Main and Renderer. Use `preload` for exposure. No cross-layer violations (Clean)
-   **Type Safety**: No `any` types. Ensure IPC message payloads are strictly typed.
-   **Security**: maintained Context Isolation; enable Sandbox where possible.

## 4. UI Automation & Verification

For **Large Changes**, the Agent should consider creating or updating a flow to verify the end-to-end user experience.

-   **Tool Selection**:
    1.  **Web/Renderer**: Use **Playwright** (`pnpm test:e2e`) as the primary tool.
    2.  **Manual/Visual**: Use **Screenshots** or **Screen Recordings** for complex interactions not easily automated.
-   **Execution**: Run tests as a final "Smoke Test" before handoff.
-   **Recording**: For major features, provide a screen recording of the execution for visual confirmation.
-   **Visual Debugging**: During development, use screenshots to verify actual UI presentation vs Design requirements.
-   **Efficiency**: Do not run full E2E suites for every small change unless UI regressions are a high risk.

## 5. Development Workflow

1.  **Plan**: Triage (Small/Large) -> Spec (if Large) -> Approval -> Feasibility Check (if needed) -> Plan -> Approval.
2.  **Code (TDD)**:
    -   **Red**: Write Failing Test.
    -   **Green**: Write Min Code.
    -   **Refactor**: Optimize and Clean.
3.  **Verify**:
    -   **Small**: Targeted unit/integration tests OK.
    -   **Final/Large**: **MUST** run full suite (`pnpm pre-commit`).
4.  **Submit**: Review self -> Update PR description -> Handover.
