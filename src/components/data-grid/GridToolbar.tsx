/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Columns3,
  Download,
  FilterX,
  Group,
  ListFilter,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ColumnFilterForm, ColumnFilterPopover } from './ColumnFilter'
import { describeFilter } from './filters'
import type { ColumnFilterValue } from './types'

type AnyColumn = Column<any, unknown>

const colName = (c: AnyColumn) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  useEffect(() => {
    if (draft === value) return
    const t = setTimeout(() => onChange(draft), 200)
    return () => clearTimeout(t)
  }, [draft, value, onChange])

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
      <Input
        type="search"
        role="searchbox"
        aria-label="Search all columns"
        placeholder="Search all columns…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setDraft('')
        }}
        className="h-10 rounded-full bg-surface-container-high pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/[0.08]"
          onClick={() => {
            setDraft('')
            onChange('')
          }}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function AddFilterButton({ columns }: { columns: AnyColumn[] }) {
  const [open, setOpen] = useState(false)
  const [colId, setColId] = useState<string>('')
  const column = columns.find((c) => c.id === colId) ?? columns[0]
  if (!columns.length) return null
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter /> Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <Select value={column.id} onValueChange={setColId}>
          <SelectTrigger aria-label="Column to filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {colName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ColumnFilterForm key={column.id} column={column} />
      </PopoverContent>
    </Popover>
  )
}

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { onRemove: () => void; removeLabel: string }

const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ children, onRemove, removeLabel, ...props }, ref) {
  return (
    <span className="inline-flex h-8 items-center rounded-lg border border-outline-variant bg-surface-container-low text-label-large text-on-surface-variant">
      <button
        ref={ref}
        type="button"
        className="flex h-full max-w-[18rem] items-center gap-1 truncate rounded-l-lg pl-3 pr-1 hover:bg-on-surface/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...props}
      >
        {children}
      </button>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="flex h-full items-center rounded-r-lg px-1.5 hover:bg-on-surface/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </button>
    </span>
  )
})

export interface GridToolbarProps {
  table: Table<any>
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  enableGlobalSearch: boolean
  enableFilters: boolean
  enableGrouping: boolean
  enableColumnPicker: boolean
  enableExport: boolean
  dirtyCount: number
  selectedCount: number
  onResetEdits: () => void
  onExport: (onlySelected: boolean) => void
  onClearFilters: () => void
  start?: ReactNode
  end?: ReactNode
}

export function GridToolbar({
  table,
  globalFilter,
  onGlobalFilterChange,
  enableGlobalSearch,
  enableFilters,
  enableGrouping,
  enableColumnPicker,
  enableExport,
  dirtyCount,
  selectedCount,
  onResetEdits,
  onExport,
  onClearFilters,
  start,
  end,
}: GridToolbarProps) {
  const allColumns = table.getAllLeafColumns().filter((c) => !c.columnDef.meta?.isSelect)
  const filterable = allColumns.filter((c) => c.getCanFilter())
  const groupable = allColumns.filter((c) => c.getCanGroup())
  const { columnFilters, grouping } = table.getState()
  const hideable = allColumns.filter((c) => c.getCanHide())
  const hiddenCount = allColumns.filter((c) => !c.getIsVisible()).length
  const isGrouped = grouping.length > 0
  const hasChips = columnFilters.length > 0 || isGrouped || !!globalFilter

  const groupedColumns = useMemo(
    () => grouping.map((id) => table.getColumn(id)).filter(Boolean) as AnyColumn[],
    [grouping, table],
  )

  return (
    <div className="flex flex-col gap-2 border-b border-outline-variant bg-surface-container-low px-3 py-2" role="toolbar" aria-label="Grid toolbar">
      <div className="flex flex-wrap items-center gap-2">
        {start}
        {enableGlobalSearch && <SearchBox value={globalFilter} onChange={onGlobalFilterChange} />}
        {enableFilters && <AddFilterButton columns={filterable} />}
        {enableGrouping && groupable.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="Group rows by column">
                <Group /> Group{isGrouped ? ` (${grouping.length})` : ''}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Group rows by</DropdownMenuLabel>
              {groupable.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsGrouped()}
                  onCheckedChange={() => c.toggleGrouping()}
                  onSelect={(e) => e.preventDefault()}
                >
                  {colName(c)}
                </DropdownMenuCheckboxItem>
              ))}
              {isGrouped && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => table.setGrouping([])}>
                    <X /> Remove grouping
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {isGrouped && (
          <>
            <Button variant="text" size="sm" aria-label="Expand all groups" onClick={() => table.toggleAllRowsExpanded(true)}>
              <ChevronsUpDown /> <span className="hidden sm:inline">Expand all</span>
            </Button>
            <Button variant="text" size="sm" aria-label="Collapse all groups" onClick={() => table.toggleAllRowsExpanded(false)}>
              <ChevronsDownUp /> <span className="hidden sm:inline">Collapse all</span>
            </Button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {dirtyCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-primary-container py-0.5 pl-3 pr-0.5 text-label-large text-primary-container-foreground">
              <span role="status">
                {dirtyCount.toLocaleString()} edited {dirtyCount === 1 ? 'cell' : 'cells'}
              </span>
              <Button variant="text" size="sm" aria-label="Revert edits" onClick={onResetEdits} className="h-7 px-3">
                <RotateCcw /> <span className="hidden sm:inline">Revert</span>
              </Button>
            </div>
          )}
          {enableColumnPicker && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Show or hide columns" title="Columns">
                  <Columns3 /> <span className="hidden sm:inline">Columns{hiddenCount ? ` (${hiddenCount} hidden)` : ''}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                {hideable.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={c.getIsVisible()}
                    onCheckedChange={(v) => c.toggleVisibility(!!v)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="truncate">{colName(c)}</span>
                    {c.getIsPinned() && (
                      <span className="ml-auto text-label-small text-on-surface-variant">pinned {c.getIsPinned()}</span>
                    )}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => table.resetColumnVisibility(true)}>Show all</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    table.resetColumnOrder(true)
                    table.resetColumnSizing(true)
                    table.resetColumnPinning()
                    table.resetColumnVisibility()
                  }}
                >
                  Reset layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {enableExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="tonal" size="sm" aria-label="Export">
                  <Download /> <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onSelect={() => onExport(false)}>
                  Export all rows to CSV
                  <span className="ml-auto text-label-small text-on-surface-variant">
                    {table.getFilteredRowModel().rows.length.toLocaleString()}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled={selectedCount === 0} onSelect={() => onExport(true)}>
                  Export selected rows
                  <span className="ml-auto text-label-small text-on-surface-variant">{selectedCount.toLocaleString()}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {end}
        </div>
      </div>

      {hasChips && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Active filters and grouping">
          {globalFilter && (
            <Chip removeLabel="Clear search" onRemove={() => onGlobalFilterChange('')}>
              <Search className="size-3.5" aria-hidden /> “{globalFilter}”
            </Chip>
          )}
          {columnFilters.map((f) => {
            const column = table.getColumn(f.id)
            if (!column) return null
            return (
              <ColumnFilterPopover key={f.id} column={column}>
                <Chip removeLabel={`Remove ${colName(column)} filter`} onRemove={() => column.setFilterValue(undefined)}>
                  <span className="text-on-surface">{colName(column)}:</span>
                  <span className="truncate">{describeFilter(f.value as ColumnFilterValue)}</span>
                </Chip>
              </ColumnFilterPopover>
            )
          })}
          {groupedColumns.map((c, i) => (
            <Chip key={c.id} removeLabel={`Remove grouping by ${colName(c)}`} onRemove={() => c.toggleGrouping()}>
              <Group className={cn('size-3.5 text-primary')} aria-hidden />
              {i > 0 && '› '}
              {colName(c)}
            </Chip>
          ))}
          {(columnFilters.length > 0 || globalFilter) && (
            <Button variant="text" size="sm" onClick={onClearFilters}>
              <FilterX /> Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
