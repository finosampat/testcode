import { useMemo, useState, type ReactNode } from 'react'
import type { Column } from '@tanstack/react-table'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DATE_OPERATORS, NUMBER_OPERATORS, TEXT_OPERATORS, defaultFilterValue } from './filters'
import type {
  ColumnFilterValue,
  DateFilterValue,
  NumberFilterValue,
  SetFilterValue,
  TextFilterValue,
} from './types'

const MAX_SET_ITEMS = 300

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumn = Column<any, unknown>

export function getSetFilterOptions(column: AnyColumn): string[] {
  const def = column.columnDef.meta?.def
  if (def?.filterOptions) return def.filterOptions
  const keys = Array.from(column.getFacetedUniqueValues().keys()).map((k) => (k == null ? '' : String(k)))
  return Array.from(new Set(keys)).sort((a, b) => a.localeCompare(b))
}

function OperatorSelect<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const noValueOps = ['blank', 'notBlank']

function TextFilterForm({ filter, onChange, name }: { filter: TextFilterValue; onChange: (f: TextFilterValue) => void; name: string }) {
  return (
    <div className="space-y-2">
      <OperatorSelect
        label={`${name} filter operator`}
        value={filter.operator}
        options={TEXT_OPERATORS}
        onChange={(operator) => onChange({ ...filter, operator })}
      />
      {!noValueOps.includes(filter.operator) && (
        <Input
          autoFocus
          aria-label={`${name} filter value`}
          placeholder="Filter…"
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
        />
      )}
    </div>
  )
}

function NumberFilterForm({
  filter,
  onChange,
  name,
}: {
  filter: NumberFilterValue
  onChange: (f: NumberFilterValue) => void
  name: string
}) {
  const parse = (s: string) => (s === '' || Number.isNaN(Number(s)) ? null : Number(s))
  return (
    <div className="space-y-2">
      <OperatorSelect
        label={`${name} filter operator`}
        value={filter.operator}
        options={NUMBER_OPERATORS}
        onChange={(operator) => onChange({ ...filter, operator })}
      />
      {!noValueOps.includes(filter.operator) && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            type="number"
            aria-label={filter.operator === 'between' ? `${name} from` : `${name} filter value`}
            placeholder={filter.operator === 'between' ? 'From' : 'Value'}
            value={filter.value ?? ''}
            onChange={(e) => onChange({ ...filter, value: parse(e.target.value) })}
          />
          {filter.operator === 'between' && (
            <Input
              type="number"
              aria-label={`${name} to`}
              placeholder="To"
              value={filter.valueTo ?? ''}
              onChange={(e) => onChange({ ...filter, valueTo: parse(e.target.value) })}
            />
          )}
        </div>
      )}
    </div>
  )
}

function DateFilterForm({ filter, onChange, name }: { filter: DateFilterValue; onChange: (f: DateFilterValue) => void; name: string }) {
  return (
    <div className="space-y-2">
      <OperatorSelect
        label={`${name} filter operator`}
        value={filter.operator}
        options={DATE_OPERATORS}
        onChange={(operator) => onChange({ ...filter, operator })}
      />
      {!noValueOps.includes(filter.operator) && (
        <div className="flex flex-col gap-2">
          <Input
            type="date"
            aria-label={filter.operator === 'between' ? `${name} from` : `${name} filter date`}
            value={filter.value}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
          />
          {filter.operator === 'between' && (
            <Input
              type="date"
              aria-label={`${name} to`}
              value={filter.valueTo ?? ''}
              onChange={(e) => onChange({ ...filter, valueTo: e.target.value })}
            />
          )}
        </div>
      )}
    </div>
  )
}

function SetFilterForm({
  column,
  filter,
  onChange,
  name,
}: {
  column: AnyColumn
  filter: SetFilterValue | undefined
  onChange: (f: SetFilterValue | undefined) => void
  name: string
}) {
  const [search, setSearch] = useState('')
  const options = useMemo(() => getSetFilterOptions(column), [column])
  const counts = column.getFacetedUniqueValues()
  const selected = useMemo(() => new Set(filter ? filter.values : options), [filter, options])
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options
  }, [options, search])
  const allVisibleSelected = visible.length > 0 && visible.every((v) => selected.has(v))
  const someVisibleSelected = visible.some((v) => selected.has(v))

  const update = (next: Set<string>) => {
    if (next.size === options.length && options.every((o) => next.has(o))) onChange(undefined)
    else onChange({ type: 'set', values: options.filter((o) => next.has(o)) })
  }

  const countFor = (o: string) => {
    let n = counts.get(o)
    if (n == null) {
      for (const [k, v] of counts) if (String(k) === o) n = v
    }
    return n ?? 0
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
        <Input
          autoFocus
          aria-label={`Search ${name} values`}
          className="pl-9"
          placeholder="Search values…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="max-h-60 overflow-y-auto rounded-md border border-outline-variant py-1" role="group" aria-label={`${name} values`}>
        <label className="flex h-9 cursor-pointer items-center gap-3 px-3 text-label-large hover:bg-on-surface/[0.08]">
          <Checkbox
            checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
            onCheckedChange={() => {
              const next = new Set(selected)
              if (allVisibleSelected) visible.forEach((v) => next.delete(v))
              else visible.forEach((v) => next.add(v))
              update(next)
            }}
          />
          (Select all{search ? ' matching' : ''})
        </label>
        {visible.slice(0, MAX_SET_ITEMS).map((o) => (
          <label
            key={o}
            className="flex h-9 cursor-pointer items-center gap-3 px-3 text-body-medium hover:bg-on-surface/[0.08]"
          >
            <Checkbox
              checked={selected.has(o)}
              onCheckedChange={(checked) => {
                const next = new Set(selected)
                if (checked) next.add(o)
                else next.delete(o)
                update(next)
              }}
            />
            <span className="flex-1 truncate">{o === '' ? '(Blank)' : o}</span>
            <span className="text-label-small tabular-nums text-on-surface-variant">{countFor(o).toLocaleString()}</span>
          </label>
        ))}
        {visible.length > MAX_SET_ITEMS && (
          <p className="px-3 py-2 text-body-small text-on-surface-variant">
            Showing {MAX_SET_ITEMS} of {visible.length.toLocaleString()} values. Refine your search.
          </p>
        )}
        {visible.length === 0 && <p className="px-3 py-2 text-body-small text-on-surface-variant">No values</p>}
      </div>
    </div>
  )
}

/** Filter form for a single column, applied live. */
export function ColumnFilterForm({ column }: { column: AnyColumn }) {
  const meta = column.columnDef.meta
  const type = meta?.filterType ?? 'text'
  const name = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
  const current = column.getFilterValue() as ColumnFilterValue | undefined
  const [draft, setDraft] = useState<ColumnFilterValue>(() =>
    current && current.type === type ? current : defaultFilterValue(type),
  )
  const apply = (f: ColumnFilterValue | undefined) => {
    if (f) setDraft(f)
    column.setFilterValue(f)
  }

  let form: ReactNode
  switch (type) {
    case 'text':
      form = <TextFilterForm name={name} filter={draft as TextFilterValue} onChange={apply} />
      break
    case 'number':
      form = <NumberFilterForm name={name} filter={draft as NumberFilterValue} onChange={apply} />
      break
    case 'date':
      form = <DateFilterForm name={name} filter={draft as DateFilterValue} onChange={apply} />
      break
    case 'set':
      form = <SetFilterForm name={name} column={column} filter={current as SetFilterValue | undefined} onChange={apply} />
      break
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-title-small">Filter: {name}</Label>
        <Button
          variant="text"
          size="sm"
          className="-mr-2"
          disabled={!column.getIsFiltered()}
          onClick={() => {
            setDraft(defaultFilterValue(type))
            column.setFilterValue(undefined)
          }}
        >
          Clear
        </Button>
      </div>
      {form}
    </div>
  )
}

export function ColumnFilterPopover({
  column,
  children,
  open,
  onOpenChange,
  align = 'start',
}: {
  column: AnyColumn
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: 'start' | 'center' | 'end'
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-72" onClick={(e) => e.stopPropagation()}>
        <ColumnFilterForm column={column} />
      </PopoverContent>
    </Popover>
  )
}
