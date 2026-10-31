import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { CellAlign, CellEditorType } from './types'

export type EditorMove = 'up' | 'down' | 'left' | 'right' | null

export interface CellEditorProps {
  type: CellEditorType
  initialValue: string
  /** True when editing was started by typing a character (replace instead of select-all). */
  startedByTyping?: boolean
  options?: string[]
  align?: CellAlign
  label: string
  onCommit: (value: string, move: EditorMove) => void
  onCancel: () => void
}

const editorClass =
  'h-full w-full min-w-0 rounded-[4px] border-2 border-primary bg-surface-container-lowest px-2 text-body-medium text-on-surface outline-none shadow-elevation-2'

export function CellEditor({
  type,
  initialValue,
  startedByTyping,
  options = [],
  align,
  label,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const [value, setValue] = useState(initialValue)
  const done = useRef(false)
  const inputRef = useRef<HTMLInputElement & HTMLSelectElement>(null)
  const keyNav = useRef(false)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    if (el instanceof HTMLInputElement && !startedByTyping && type === 'text') el.select()
    if (el instanceof HTMLInputElement && startedByTyping && type === 'text') {
      const len = el.value.length
      el.setSelectionRange(len, len)
    }
  }, [startedByTyping, type])

  const commit = (v: string, move: EditorMove) => {
    if (done.current) return
    done.current = true
    onCommit(v, move)
  }
  const cancel = () => {
    if (done.current) return
    done.current = true
    onCancel()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(value, e.shiftKey ? 'up' : 'down')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      commit(value, e.shiftKey ? 'left' : 'right')
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    } else if (type === 'select' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      keyNav.current = true
    }
  }

  const common = {
    'aria-label': label,
    onKeyDown,
    onBlur: () => commit(value, null),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onDoubleClick: (e: React.MouseEvent) => e.stopPropagation(),
  }

  if (type === 'select') {
    const opts = options.includes(value) || value === '' ? options : [value, ...options]
    return (
      <select
        ref={inputRef}
        className={cn(editorClass, 'cursor-pointer')}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (!keyNav.current) commit(e.target.value, null)
          keyNav.current = false
        }}
        {...common}
      >
        {value === '' && <option value="">—</option>}
        {opts.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      ref={inputRef}
      type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
      inputMode={type === 'number' ? 'decimal' : undefined}
      step={type === 'number' ? 'any' : undefined}
      className={cn(editorClass, align === 'right' && 'text-right tabular-nums')}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...common}
    />
  )
}
