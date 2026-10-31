/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from 'react'
import type { Header, Table } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  ArrowUpZA,
  EyeOff,
  Filter,
  Group,
  MoreVertical,
  MoveHorizontal,
  Pin,
  PinOff,
  Ungroup,
  X,
} from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ColumnFilterPopover } from './ColumnFilter'

export type DropSide = 'before' | 'after'

const enableMultiSortKey = (e: React.KeyboardEvent) => e.shiftKey

export interface HeaderCellProps {
  header: Header<any, unknown>
  table: Table<any>
  colIndex: number
  style: CSSProperties
  pinnedEdge?: 'left' | 'right'
  multiSelect: boolean
  enableColumnReordering: boolean
  enableColumnPinning: boolean
  enableGrouping: boolean
  dropSide?: DropSide
  isDragging: boolean
  onDragStartColumn: (id: string) => void
  onDragOverColumn: (id: string, side: DropSide) => void
  onDropColumn: (id: string, side: DropSide) => void
  onDragEndColumn: () => void
}

const iconBtn =
  'relative flex size-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-[background-color,opacity] hover:bg-on-surface/[0.08] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-on-surface/[0.12] data-[state=open]:opacity-100 [&_svg]:size-4'

export function HeaderCell({
  header,
  table,
  colIndex,
  style,
  pinnedEdge,
  multiSelect,
  enableColumnReordering,
  enableColumnPinning,
  enableGrouping,
  dropSide,
  isDragging,
  onDragStartColumn,
  onDragOverColumn,
  onDropColumn,
  onDragEndColumn,
}: HeaderCellProps) {
  const column = header.column
  const meta = column.columnDef.meta
  const name = typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id

  if (meta?.isSelect) {
    const all = table.getIsAllRowsSelected()
    const some = table.getIsSomeRowsSelected()
    return (
      <div
        role="columnheader"
        aria-colindex={colIndex + 1}
        className="dg-header-cell flex items-center justify-center"
        data-pinned-edge={pinnedEdge}
        style={style}
      >
        {multiSelect ? (
          <Checkbox
            aria-label="Select all rows"
            checked={all ? true : some ? 'indeterminate' : false}
            onCheckedChange={() => table.toggleAllRowsSelected(!all)}
          />
        ) : (
          <span className="sr-only">Selection</span>
        )}
      </div>
    )
  }

  const sorted = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const multiSorted = table.getState().sorting.length > 1
  const canSort = column.getCanSort()
  const canFilter = column.getCanFilter()
  const canResize = column.getCanResize()
  const canGroup = enableGrouping && column.getCanGroup()
  const isGrouped = column.getIsGrouped()
  const pinned = column.getIsPinned()
  const canDrag = enableColumnReordering && !meta?.def?.lockPosition
  const alignRight = meta?.align === 'right'
  const tooltip = meta?.def?.headerTooltip

  const sideFromEvent = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return e.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
  }

  return (
    <div
      role="columnheader"
      aria-colindex={colIndex + 1}
      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : canSort ? 'none' : undefined}
      className={cn('dg-header-cell group/header relative flex items-center', isDragging && 'opacity-50')}
      data-pinned-edge={pinnedEdge}
      data-drop={dropSide}
      style={style}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('application/x-grid-column')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOverColumn(column.id, sideFromEvent(e))
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes('application/x-grid-column')) return
        e.preventDefault()
        onDropColumn(column.id, sideFromEvent(e))
      }}
    >
      <div
        className={cn('flex h-full min-w-0 flex-1 items-center gap-0.5 pl-3 pr-1', canDrag && 'cursor-grab active:cursor-grabbing')}
        draggable={canDrag}
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-grid-column', column.id)
          e.dataTransfer.effectAllowed = 'move'
          onDragStartColumn(column.id)
        }}
        onDragEnd={onDragEndColumn}
      >
        {/* Not a <button>: Chrome won't start a drag from a button inside a draggable element. */}
        <div
          role="button"
          tabIndex={canSort ? 0 : -1}
          aria-disabled={!canSort || undefined}
          className={cn(
            'flex h-full min-w-0 flex-1 items-center gap-1 rounded text-left text-title-small text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
            alignRight && 'flex-row-reverse text-right',
            canSort ? 'cursor-pointer hover:text-on-surface' : 'cursor-default',
            sorted && 'text-on-surface',
          )}
          onClick={canSort ? column.getToggleSortingHandler() : undefined}
          onKeyDown={(e) => {
            if (!canSort || (e.key !== 'Enter' && e.key !== ' ')) return
            e.preventDefault()
            column.toggleSorting(undefined, enableMultiSortKey(e))
          }}
          title={tooltip ?? (canSort ? `${name} — click to sort, Shift+click to multi-sort` : name)}
          aria-label={canSort ? `${name}, sortable` : name}
        >
          <span className="truncate">{name}</span>
          {sorted && (
            <span className="flex shrink-0 items-center text-primary" aria-hidden>
              {sorted === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
              {multiSorted && <span className="text-label-small">{sortIndex + 1}</span>}
            </span>
          )}
          {isGrouped && <Group aria-hidden className="size-3.5 shrink-0 text-primary" />}
        </div>

        {canFilter && (
          <ColumnFilterPopover column={column} align={alignRight ? 'end' : 'start'}>
            <button
              type="button"
              className={cn(
                iconBtn,
                column.getIsFiltered()
                  ? 'text-primary opacity-100'
                  : 'opacity-0 group-hover/header:opacity-100 [@media(pointer:coarse)]:opacity-100',
              )}
              aria-label={`Filter ${name}${column.getIsFiltered() ? ' (active)' : ''}`}
              draggable={false}
            >
              <Filter className={cn(column.getIsFiltered() && 'fill-current')} />
            </button>
          </ColumnFilterPopover>
        )}

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(iconBtn, 'opacity-0 group-hover/header:opacity-100 [@media(pointer:coarse)]:opacity-100')}
              aria-label={`${name} column menu`}
              draggable={false}
            >
              <MoreVertical />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {canSort && (
              <>
                <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
                  <ArrowDownAZ /> Sort ascending
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
                  <ArrowUpZA /> Sort descending
                </DropdownMenuItem>
                {sorted && (
                  <DropdownMenuItem onSelect={() => column.clearSorting()}>
                    <X /> Clear sort
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {enableColumnPinning && (
              <>
                {pinned !== 'left' && (
                  <DropdownMenuItem onSelect={() => column.pin('left')}>
                    <Pin className="-rotate-45" /> Pin left
                  </DropdownMenuItem>
                )}
                {pinned !== 'right' && (
                  <DropdownMenuItem onSelect={() => column.pin('right')}>
                    <Pin className="rotate-45" /> Pin right
                  </DropdownMenuItem>
                )}
                {pinned && (
                  <DropdownMenuItem onSelect={() => column.pin(false)}>
                    <PinOff /> Unpin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            {canGroup && (
              <>
                <DropdownMenuItem onSelect={() => column.toggleGrouping()}>
                  {isGrouped ? <Ungroup /> : <Group />} {isGrouped ? `Ungroup by ${name}` : `Group by ${name}`}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {canResize && (
              <DropdownMenuItem onSelect={() => column.resetSize()}>
                <MoveHorizontal /> Reset width
              </DropdownMenuItem>
            )}
            {column.getCanHide() && (
              <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
                <EyeOff /> Hide column
                <DropdownMenuShortcut />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {canResize && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize ${name}`}
          className={cn('dg-resizer', column.getIsResizing() && 'is-resizing')}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          onDoubleClick={() => column.resetSize()}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
