import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../../../shared/contracts/ipc'
import type {
  CreateGitWorktreeInput,
  CreateGitWorktreeResult,
  GetGitStatusSummaryInput,
  GetGitStatusSummaryResult,
  ListGitBranchesInput,
  ListGitBranchesResult,
  ListGitWorktreesInput,
  ListGitWorktreesResult,
  RemoveGitWorktreeInput,
  RemoveGitWorktreeResult,
  RenameGitBranchInput,
  SuggestWorktreeNamesInput,
  SuggestWorktreeNamesResult,
} from '../../../../shared/contracts/dto'
import type { IpcRegistrationDisposable } from '../../../../app/main/ipc/types'
import type { ApprovedWorkspaceStore } from '../../../../contexts/workspace/infrastructure/approval/ApprovedWorkspaceStore'
import {
  createGitWorktree,
  getGitStatusSummary,
  listGitBranches,
  listGitWorktrees,
  removeGitWorktree,
  renameGitBranch,
} from '../../infrastructure/git/GitWorktreeService'
import { suggestWorktreeNames } from '../../infrastructure/git/WorktreeNameSuggester'
import {
  normalizeCreateGitWorktreePayload,
  normalizeGetGitStatusSummaryPayload,
  normalizeListGitBranchesPayload,
  normalizeListGitWorktreesPayload,
  normalizeRemoveGitWorktreePayload,
  normalizeRenameGitBranchPayload,
  normalizeSuggestWorktreeNamesPayload,
} from './validate'

export function registerWorktreeIpcHandlers(
  approvedWorkspaces: ApprovedWorkspaceStore,
): IpcRegistrationDisposable {
  ipcMain.handle(
    IPC_CHANNELS.worktreeListBranches,
    async (_event, payload: ListGitBranchesInput): Promise<ListGitBranchesResult> => {
      const normalized = normalizeListGitBranchesPayload(payload)
      const isApproved = await approvedWorkspaces.isPathApproved(normalized.repoPath)
      if (!isApproved) {
        throw new Error('worktree:list-branches repoPath is outside approved workspaces')
      }

      return await listGitBranches({ repoPath: normalized.repoPath })
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.worktreeListWorktrees,
    async (_event, payload: ListGitWorktreesInput): Promise<ListGitWorktreesResult> => {
      const normalized = normalizeListGitWorktreesPayload(payload)
      const isApproved = await approvedWorkspaces.isPathApproved(normalized.repoPath)
      if (!isApproved) {
        throw new Error('worktree:list-worktrees repoPath is outside approved workspaces')
      }

      return await listGitWorktrees({ repoPath: normalized.repoPath })
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.worktreeStatusSummary,
    async (_event, payload: GetGitStatusSummaryInput): Promise<GetGitStatusSummaryResult> => {
      const normalized = normalizeGetGitStatusSummaryPayload(payload)
      const isApproved = await approvedWorkspaces.isPathApproved(normalized.repoPath)
      if (!isApproved) {
        throw new Error('worktree:list-status-summary repoPath is outside approved workspaces')
      }

      return await getGitStatusSummary({ repoPath: normalized.repoPath })
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.worktreeCreate,
    async (_event, payload: CreateGitWorktreeInput): Promise<CreateGitWorktreeResult> => {
      const normalized = normalizeCreateGitWorktreePayload(payload)

      const [repoApproved, worktreesRootApproved] = await Promise.all([
        approvedWorkspaces.isPathApproved(normalized.repoPath),
        approvedWorkspaces.isPathApproved(normalized.worktreesRoot),
      ])

      if (!repoApproved || !worktreesRootApproved) {
        throw new Error('worktree:create path is outside approved workspaces')
      }

      const worktree = await createGitWorktree(normalized)
      return { worktree }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.worktreeRemove,
    async (_event, payload: RemoveGitWorktreeInput): Promise<RemoveGitWorktreeResult> => {
      const normalized = normalizeRemoveGitWorktreePayload(payload)

      const [repoApproved, worktreeApproved] = await Promise.all([
        approvedWorkspaces.isPathApproved(normalized.repoPath),
        approvedWorkspaces.isPathApproved(normalized.worktreePath),
      ])

      if (!repoApproved || !worktreeApproved) {
        throw new Error('worktree:remove path is outside approved workspaces')
      }

      return await removeGitWorktree(normalized)
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.worktreeRenameBranch,
    async (_event, payload: RenameGitBranchInput): Promise<void> => {
      const normalized = normalizeRenameGitBranchPayload(payload)

      const [repoApproved, worktreeApproved] = await Promise.all([
        approvedWorkspaces.isPathApproved(normalized.repoPath),
        approvedWorkspaces.isPathApproved(normalized.worktreePath),
      ])

      if (!repoApproved || !worktreeApproved) {
        throw new Error('worktree:rename-branch path is outside approved workspaces')
      }

      await renameGitBranch(normalized)
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.worktreeSuggestNames,
    async (_event, payload: SuggestWorktreeNamesInput): Promise<SuggestWorktreeNamesResult> => {
      const normalized = normalizeSuggestWorktreeNamesPayload(payload)
      const isApproved = await approvedWorkspaces.isPathApproved(normalized.cwd)
      if (!isApproved) {
        throw new Error('worktree:suggest-names cwd is outside approved workspaces')
      }

      return await suggestWorktreeNames(normalized)
    },
  )

  return {
    dispose: () => {
      ipcMain.removeHandler(IPC_CHANNELS.worktreeListBranches)
      ipcMain.removeHandler(IPC_CHANNELS.worktreeListWorktrees)
      ipcMain.removeHandler(IPC_CHANNELS.worktreeStatusSummary)
      ipcMain.removeHandler(IPC_CHANNELS.worktreeCreate)
      ipcMain.removeHandler(IPC_CHANNELS.worktreeRemove)
      ipcMain.removeHandler(IPC_CHANNELS.worktreeRenameBranch)
      ipcMain.removeHandler(IPC_CHANNELS.worktreeSuggestNames)
    },
  }
}
