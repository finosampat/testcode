/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FilterFn } from '@tanstack/react-table'

import type {
  ColumnFilterValue,
  DateFilterOperator,
  FilterType,
  NumberFilterOperator,
  TextFilterOperator,
} from './types'
import { toDayKey } from './utils'

export const TEXT_OPERATORS: { value: TextFilterOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Does not equal' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'blank', label: 'Is blank' },
  { value: 'notBlank', label: 'Is not blank' },
]

export const NUMBER_OPERATORS: { value: NumberFilterOperator; label: string; symbol: string }[] = [
  { value: 'eq', label: 'Equals', symbol: '=' },
  { value: 'neq', label: 'Does not equal', symbol: '≠' },
  { value: 'gt', label: 'Greater than', symbol: '>' },
  { value: 'gte', label: 'Greater than or equal', symbol: '≥' },
  { value: 'lt', label: 'Less than', symbol: '<' },
  { value: 'lte', label: 'Less than or equal', symbol: '≤' },
  { value: 'between', label: 'Between', symbol: '↔' },
  { value: 'blank', label: 'Is blank', symbol: '∅' },
  { value: 'notBlank', label: 'Is not blank', symbol: '≠∅' },
]

export const DATE_OPERATORS: { value: DateFilterOperator; label: string }[] = [
  { value: 'on', label: 'On' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  { value: 'blank', label: 'Is blank' },
  { value: 'notBlank', label: 'Is not blank' },
]

const isBlank = (v: unknown) => v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))

export function isFilterActive(filter: ColumnFilterValue | undefined | null): boolean {
  if (!filter) return false
  switch (filter.type) {
    case 'text':
      return filter.operator === 'blank' || filter.operator === 'notBlank' || filter.value !== ''
    case 'number':
      if (filter.operator === 'blank' || filter.operator === 'notBlank') return true
      if (filter.operator === 'between') return filter.value != null || filter.valueTo != null
      return filter.value != null
    case 'date':
      if (filter.operator === 'blank' || filter.operator === 'notBlank') return true
      if (filter.operator === 'between') return !!filter.value || !!filter.valueTo
      return !!filter.value
    case 'set':
      return true
  }
}

export function matchesFilter(value: unknown, filter: ColumnFilterValue): boolean {
  switch (filter.type) {
    case 'text': {
      if (filter.operator === 'blank') return isBlank(value)
      if (filter.operator === 'notBlank') return !isBlank(value)
      const s = value instanceof Date ? toDayKey(value) : String(value ?? '').toLowerCase()
      const q = filter.value.toLowerCase()
      switch (filter.operator) {
        case 'contains':
          return s.includes(q)
        case 'notContains':
          return !s.includes(q)
        case 'equals':
          return s === q
        case 'notEquals':
          return s !== q
        case 'startsWith':
          return s.startsWith(q)
        case 'endsWith':
          return s.endsWith(q)
      }
      return true
    }
    case 'number': {
      if (filter.operator === 'blank') return isBlank(value)
      if (filter.operator === 'notBlank') return !isBlank(value)
      if (isBlank(value)) return false
      const n = Number(value)
      if (Number.isNaN(n)) return false
      const a = filter.value
      switch (filter.operator) {
        case 'eq':
          return a == null || n === a
        case 'neq':
          return a == null || n !== a
        case 'gt':
          return a == null || n > a
        case 'gte':
          return a == null || n >= a
        case 'lt':
          return a == null || n < a
        case 'lte':
          return a == null || n <= a
        case 'between':
          return (a == null || n >= a) && (filter.valueTo == null || n <= filter.valueTo)
      }
      return true
    }
    case 'date': {
      if (filter.operator === 'blank') return isBlank(value)
      if (filter.operator === 'notBlank') return !isBlank(value)
      const key = toDayKey(value)
      if (!key) return false
      const a = filter.value
      switch (filter.operator) {
        case 'on':
          return !a || key === a
        case 'before':
          return !a || key < a
        case 'after':
          return !a || key > a
        case 'between':
          return (!a || key >= a) && (!filter.valueTo || key <= filter.valueTo)
      }
      return true
    }
    case 'set':
      return filter.values.includes(value == null ? '' : String(value))
  }
}

export const gridFilterFn: FilterFn<any> = (row, columnId, filterValue: ColumnFilterValue) =>
  matchesFilter(row.getValue(columnId), filterValue)
gridFilterFn.autoRemove = (value: ColumnFilterValue | undefined) => !isFilterActive(value)

export const globalSearchFn: FilterFn<any> = (row, columnId, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const value = row.getValue(columnId)
  if (value == null) return false
  const s = value instanceof Date ? toDayKey(value) : String(value)
  return s.toLowerCase().includes(q)
}

export function defaultFilterValue(type: FilterType, options: string[] = []): ColumnFilterValue {
  switch (type) {
    case 'text':
      return { type: 'text', operator: 'contains', value: '' }
    case 'number':
      return { type: 'number', operator: 'eq', value: null }
    case 'date':
      return { type: 'date', operator: 'on', value: '' }
    case 'set':
      return { type: 'set', values: options }
  }
}

/** Short, human readable summary used by filter chips. */
export function describeFilter(filter: ColumnFilterValue, format: (v: string) => string = (v) => v): string {
  switch (filter.type) {
    case 'text': {
      const op = TEXT_OPERATORS.find((o) => o.value === filter.operator)?.label.toLowerCase() ?? ''
      return filter.operator === 'blank' || filter.operator === 'notBlank' ? op : `${op} "${filter.value}"`
    }
    case 'number': {
      const op = NUMBER_OPERATORS.find((o) => o.value === filter.operator)
      if (filter.operator === 'blank' || filter.operator === 'notBlank') return op?.label.toLowerCase() ?? ''
      if (filter.operator === 'between') return `${filter.value ?? '−∞'} – ${filter.valueTo ?? '∞'}`
      return `${op?.symbol ?? ''} ${filter.value ?? ''}`
    }
    case 'date': {
      const op = DATE_OPERATORS.find((o) => o.value === filter.operator)?.label.toLowerCase() ?? ''
      if (filter.operator === 'blank' || filter.operator === 'notBlank') return op
      if (filter.operator === 'between') return `${filter.value || '…'} – ${filter.valueTo || '…'}`
      return `${op} ${filter.value}`
    }
    case 'set': {
      if (filter.values.length === 0) return 'none'
      const shown = filter.values.slice(0, 2).map(format).join(', ')
      return filter.values.length > 2 ? `${shown} +${filter.values.length - 2}` : shown
    }
  }
}
