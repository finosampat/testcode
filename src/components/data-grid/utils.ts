/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ColumnDef } from './types'

export function getPath(obj: any, path: string): unknown {
  if (obj == null) return undefined
  if (!path.includes('.')) return obj[path]
  let cur = obj
  for (const key of path.split('.')) {
    if (cur == null) return undefined
    cur = cur[key]
  }
  return cur
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.')
  const root: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) }
  let cur = root
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    cur[k] = cur[k] == null ? {} : { ...cur[k] }
    cur = cur[k]
  }
  cur[keys[keys.length - 1]] = value
  return root
}

export function startCase(field: string): string {
  const last = field.split('.').pop() ?? field
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase())
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return parseDayKey(value)
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

/** `YYYY-MM-DD` in local time. */
export function toDayKey(value: unknown): string {
  const d = toDate(value)
  if (!d) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

const defaultDateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function formatCellValue(def: ColumnDef | undefined, value: unknown, data: unknown): string {
  if (def?.valueFormatter) return def.valueFormatter(value, data)
  if (value == null) return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : defaultDateFormat.format(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/** Plain value used for CSV export and clipboard copy. */
export function toPlainString(value: unknown, dateMode: 'iso' | 'day' = 'iso'): string {
  if (value == null) return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return dateMode === 'day' ? toDayKey(value) : value.toISOString()
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  return Object.is(a, b)
}

export function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value) || /^\s|\s$/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function downloadFile(content: string, fileName: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\uFEFF', content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // fall through to the legacy path
    }
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
