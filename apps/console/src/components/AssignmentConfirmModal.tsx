import { useEffect, useRef, useState } from 'react'
import './AssignmentConfirmModal.css'

interface AssignmentConfirmModalProps {
  clientName: string
  caregiverName: string
  matchScore: number
  onConfirm: (note: string) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function AssignmentConfirmModal({
  clientName,
  caregiverName,
  matchScore,
  onConfirm,
  onCancel,
  isSubmitting,
}: AssignmentConfirmModalProps) {
  const [note,  setNote]  = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onCancel])

  async function handleConfirm() {
    setError(null)
    try {
      await onConfirm(note)
    } catch (e) {
      console.error('[AssignmentConfirmModal] assignment failed:', e)
      setError('Something went wrong — try again.')
    }
  }

  return (
    <div
      className="confirm-modal__backdrop"
      onClick={() => { if (!isSubmitting) onCancel() }}
    >
      <div
        className="confirm-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="confirm-modal__title">
          Confirm assignment
        </h2>
        <p className="confirm-modal__body">
          Assign {caregiverName} to {clientName}? (Match score: {matchScore}/5)
        </p>
        <label className="confirm-modal__label" htmlFor="confirm-modal-note">
          Add a note (optional)
        </label>
        <textarea
          id="confirm-modal-note"
          ref={textareaRef}
          className="confirm-modal__textarea"
          value={note}
          onChange={e => setNote(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
        {error && (
          <p className="confirm-modal__error" role="alert">{error}</p>
        )}
        <div className="confirm-modal__actions">
          <button
            className="confirm-modal__btn confirm-modal__btn--cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="confirm-modal__btn confirm-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Assigning…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
