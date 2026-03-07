import React, { type Dispatch, type SetStateAction } from 'react'
import type { TaskPriority } from '../../../types'
import { TASK_PRIORITY_OPTIONS } from '../constants'
import { normalizeTaskTagSelection } from '../helpers'
import type { TaskEditorState } from '../types'

interface TaskEditorWindowProps {
  taskEditor: TaskEditorState | null
  taskTitleProviderLabel: string
  taskTitleModelLabel: string
  taskTagOptions: string[]
  setTaskEditor: Dispatch<SetStateAction<TaskEditorState | null>>
  closeTaskEditor: () => void
  generateTaskEditorTitle: () => Promise<void>
  saveTaskEdits: () => Promise<void>
}

export function TaskEditorWindow({
  taskEditor,
  taskTitleProviderLabel,
  taskTitleModelLabel,
  taskTagOptions,
  setTaskEditor,
  closeTaskEditor,
  generateTaskEditorTitle,
  saveTaskEdits,
}: TaskEditorWindowProps): React.JSX.Element | null {
  if (!taskEditor) {
    return null
  }

  return (
    <div
      className="cove-window-backdrop workspace-task-creator-backdrop"
      onClick={() => {
        closeTaskEditor()
      }}
    >
      <section
        className="cove-window workspace-task-creator"
        data-testid="workspace-task-editor"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <h3>Edit Task</h3>
        <p className="workspace-task-creator__meta">
          Auto-task provider: {taskTitleProviderLabel} · Model: {taskTitleModelLabel}
        </p>

        <div className="workspace-task-creator__field-row">
          <label htmlFor="workspace-task-editor-title">Task Name (optional)</label>
          <input
            id="workspace-task-editor-title"
            data-testid="workspace-task-editor-title"
            value={taskEditor.title}
            disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
            placeholder="Leave empty to auto-generate"
            onChange={event => {
              const nextValue = event.target.value
              setTaskEditor(prev =>
                prev
                  ? {
                      ...prev,
                      title: nextValue,
                      titleGeneratedInEditor: false,
                      error: null,
                    }
                  : prev,
              )
            }}
          />
        </div>

        <div className="workspace-task-creator__field-row">
          <label htmlFor="workspace-task-editor-requirement">
            Task Requirement (Prompt to Agent)
          </label>
          <textarea
            id="workspace-task-editor-requirement"
            data-testid="workspace-task-editor-requirement"
            value={taskEditor.requirement}
            disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
            placeholder="输入任务要求..."
            onChange={event => {
              const nextValue = event.target.value
              setTaskEditor(prev =>
                prev
                  ? {
                      ...prev,
                      requirement: nextValue,
                      error: null,
                    }
                  : prev,
              )
            }}
          />
        </div>

        <div className="workspace-task-creator__field-grid">
          <div className="workspace-task-creator__field-row">
            <label htmlFor="workspace-task-editor-priority">Priority</label>
            <select
              id="workspace-task-editor-priority"
              data-testid="workspace-task-editor-priority"
              value={taskEditor.priority}
              disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
              onChange={event => {
                const nextPriority = event.target.value as TaskPriority
                setTaskEditor(prev =>
                  prev
                    ? {
                        ...prev,
                        priority: nextPriority,
                      }
                    : prev,
                )
              }}
            >
              {TASK_PRIORITY_OPTIONS.map(option => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="workspace-task-creator__field-row">
            <label>Tags (select from presets)</label>
            <div
              className="workspace-task-creator__tag-options"
              data-testid="workspace-task-editor-tag-options"
            >
              {taskTagOptions.length > 0 ? (
                taskTagOptions.map(tag => {
                  const checked = taskEditor.selectedTags.includes(tag)

                  return (
                    <label className="workspace-task-creator__tag-option" key={tag}>
                      <input
                        type="checkbox"
                        data-testid={`workspace-task-editor-tag-option-${tag}`}
                        checked={checked}
                        disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
                        onChange={event => {
                          const isChecked = event.target.checked
                          setTaskEditor(prev => {
                            if (!prev) {
                              return prev
                            }

                            const nextSelected = isChecked
                              ? [...prev.selectedTags, tag]
                              : prev.selectedTags.filter(item => item !== tag)

                            return {
                              ...prev,
                              selectedTags: normalizeTaskTagSelection(nextSelected, taskTagOptions),
                            }
                          })
                        }}
                      />
                      <span>{tag}</span>
                    </label>
                  )
                })
              ) : (
                <span className="workspace-task-creator__hint">
                  No task tags configured. Add tags in Settings.
                </span>
              )}
            </div>
          </div>
        </div>

        <label className="cove-window__checkbox workspace-task-creator__checkbox">
          <input
            type="checkbox"
            data-testid="workspace-task-editor-auto-generate-title"
            checked={taskEditor.autoGenerateTitle}
            disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
            onChange={event => {
              setTaskEditor(prev =>
                prev
                  ? {
                      ...prev,
                      autoGenerateTitle: event.target.checked,
                    }
                  : prev,
              )
            }}
          />
          <span>Auto-generate title/priority/tags when title is empty</span>
        </label>

        {taskEditor.error ? (
          <p className="cove-window__error workspace-task-creator__error">{taskEditor.error}</p>
        ) : null}

        <div className="cove-window__actions workspace-task-creator__actions">
          <button
            type="button"
            className="cove-window__action cove-window__action--ghost workspace-task-creator__action workspace-task-creator__action--ghost"
            data-testid="workspace-task-edit-cancel"
            disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
            onClick={() => {
              closeTaskEditor()
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cove-window__action cove-window__action--secondary workspace-task-creator__action workspace-task-creator__action--secondary"
            data-testid="workspace-task-edit-generate-title"
            disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
            onClick={() => {
              void generateTaskEditorTitle()
            }}
          >
            {taskEditor.isGeneratingTitle ? 'Generating...' : 'Generate by AI'}
          </button>
          <button
            type="button"
            className="cove-window__action cove-window__action--primary workspace-task-creator__action workspace-task-creator__action--primary"
            data-testid="workspace-task-edit-submit"
            disabled={taskEditor.isSaving || taskEditor.isGeneratingTitle}
            onClick={() => {
              void saveTaskEdits()
            }}
          >
            {taskEditor.isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </section>
    </div>
  )
}
