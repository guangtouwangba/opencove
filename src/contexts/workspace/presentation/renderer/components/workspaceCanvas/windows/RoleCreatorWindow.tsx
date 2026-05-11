import React, { type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from '@app/renderer/i18n'
import type { RoleCreatorState } from '../types'

interface RoleCreatorWindowProps {
  roleCreator: RoleCreatorState | null
  setRoleCreator: Dispatch<SetStateAction<RoleCreatorState | null>>
  closeRoleCreator: () => void
  createRole: () => void
}

export function RoleCreatorWindow({
  roleCreator,
  setRoleCreator,
  closeRoleCreator,
  createRole,
}: RoleCreatorWindowProps): React.JSX.Element | null {
  const { t } = useTranslation()

  if (!roleCreator) {
    return null
  }

  const isDisabled = roleCreator.isCreating

  return (
    <div
      className="cove-window-backdrop workspace-role-creator-backdrop"
      onClick={closeRoleCreator}
    >
      <section
        className="cove-window workspace-role-creator"
        data-testid="workspace-role-creator"
        onClick={event => {
          event.stopPropagation()
        }}
      >
        <h3>{roleCreator.mode === 'edit' ? t('roleCreator.editTitle') : t('roleCreator.title')}</h3>

        <div className="cove-window__fields">
          <div className="cove-window__field-row">
            <label htmlFor="workspace-role-name">{t('roleCreator.name')}</label>
            <input
              id="workspace-role-name"
              data-testid="workspace-role-name-input"
              value={roleCreator.name}
              autoFocus
              disabled={isDisabled}
              placeholder={t('roleCreator.namePlaceholder')}
              onChange={event => {
                const name = event.target.value
                setRoleCreator(prev => (prev ? { ...prev, name, error: null } : prev))
              }}
            />
          </div>

          <div className="cove-window__field-row">
            <label htmlFor="workspace-role-description">{t('roleCreator.description')}</label>
            <textarea
              id="workspace-role-description"
              data-testid="workspace-role-description-input"
              value={roleCreator.description}
              disabled={isDisabled}
              placeholder={t('roleCreator.descriptionPlaceholder')}
              onChange={event => {
                const description = event.target.value
                setRoleCreator(prev => (prev ? { ...prev, description, error: null } : prev))
              }}
            />
          </div>

          <div className="cove-window__field-row">
            <label htmlFor="workspace-role-prompt">{t('roleCreator.promptTemplate')}</label>
            <textarea
              id="workspace-role-prompt"
              data-testid="workspace-role-prompt-input"
              value={roleCreator.promptTemplate}
              disabled={isDisabled}
              placeholder={t('roleCreator.promptTemplatePlaceholder')}
              onChange={event => {
                const promptTemplate = event.target.value
                setRoleCreator(prev => (prev ? { ...prev, promptTemplate, error: null } : prev))
              }}
            />
          </div>

          <div className="cove-window__field-row">
            <label htmlFor="workspace-role-input-hint">{t('roleCreator.inputHint')}</label>
            <input
              id="workspace-role-input-hint"
              data-testid="workspace-role-input-hint-input"
              value={roleCreator.inputHint}
              disabled={isDisabled}
              placeholder={t('roleCreator.inputHintPlaceholder')}
              onChange={event => {
                const inputHint = event.target.value
                setRoleCreator(prev => (prev ? { ...prev, inputHint, error: null } : prev))
              }}
            />
          </div>

          <div className="cove-window__field-row">
            <label htmlFor="workspace-role-output-format">{t('roleCreator.outputFormat')}</label>
            <input
              id="workspace-role-output-format"
              data-testid="workspace-role-output-format-input"
              value={roleCreator.outputFormat}
              disabled={isDisabled}
              placeholder={t('roleCreator.outputFormatPlaceholder')}
              onChange={event => {
                const outputFormat = event.target.value
                setRoleCreator(prev => (prev ? { ...prev, outputFormat, error: null } : prev))
              }}
            />
          </div>
        </div>

        {roleCreator.error ? <p className="cove-window__error">{roleCreator.error}</p> : null}

        <div className="cove-window__actions">
          <button
            type="button"
            className="cove-window__action cove-window__action--ghost"
            disabled={isDisabled}
            onClick={closeRoleCreator}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="cove-window__action cove-window__action--primary"
            data-testid="workspace-role-create"
            disabled={isDisabled}
            onClick={createRole}
          >
            {isDisabled
              ? roleCreator.mode === 'edit'
                ? t('common.saving')
                : t('common.creating')
              : roleCreator.mode === 'edit'
                ? t('common.save')
                : t('common.create')}
          </button>
        </div>
      </section>
    </div>
  )
}
