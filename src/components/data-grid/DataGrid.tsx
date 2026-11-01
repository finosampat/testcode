/* eslint-disable @typescript-eslint/no-explicit-any */
import './data-grid.css'

import { useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type Column,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type GroupingState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual'
import { ChevronRight } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CellEditor, type EditorMove } from './CellEditor'
import { SELECT_COLUMN_ID, buildColumns, getColId } from './columns'
import { createGlobalSearchFn } from './filters'
import { GridFooter, type RangeStats } from './GridFooter'
import { EmptyState, ErrorState, SkeletonRows } from './GridStates'
import { GridToolbar } from './GridToolbar'
import { HeaderCell, type DropSide } from './HeaderCell'
import type { ColumnDef, ColumnFilterValue, ColumnState, DataGridApi, DataGridProps, ExportCsvOptions, FilterModel } from './types'
import {
  clamp,
  copyText,
  downloadFile,
  escapeCsv,
  formatCellValue,
  parseDayKey,
  setPath,
  toDayKey,
  toPlainString,
  valuesEqual,
} from './utils'

const DENSITY = {
  compact: { row: 32, header: 40 },
  standard: { row: 42, header: 48 },
  comfortable: { row: 52, header: 56 },
} as const

const AGG_LABEL = { sum: 'Σ', avg: 'avg', count: 'count', min: 'min', max: 'max' } as const

interface CellPos {
  r: number
  c: number
}

interface EditingCell {
  rowId: string
  colId: string
  initial: string
  typed: boolean
}

const resolve = <T,>(u: Updater<T>, old: T): T => (typeof u === 'function' ? (u as (o: T) => T)(old) : u)

function useChangeEffect(effect: () => void, deps: unknown[]) {
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

const colName = (c: Column<any, unknown>) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)

const dirtyKey = (rowId: string, colId: string) => `${rowId}\u0000${colId}`

function toEditorString(value: unknown, editorType: string | undefined): string {
  if (value == null) return ''
  if (editorType === 'date') return toDayKey(value)
  if (value instanceof Date) return toDayKey(value)
  return String(value)
}

/**
 * Feature-rich, virtualized data grid built on TanStack Table.
 */
export function DataGrid<TData>(props: DataGridProps<TData>) {
  const {
    rowData,
    columnDefs,
    getRowId,
    loading = false,
    error,
    apiRef,
    className,
    'aria-label': ariaLabel = 'Data grid',
    height = 600,
    density = 'standard',
    rowHeight: rowHeightProp,
    pagination = false,
    pageSize: pageSizeProp = 100,
    pageSizeOptions = [25, 50, 100, 250, 500, 1000],
    rowSelection: selectionMode = 'multiple',
    checkboxSelection = true,
    selectOnRowClick = true,
    enableSorting = true,
    enableMultiSort = true,
    enableFilters = true,
    enableGlobalSearch = true,
    enableColumnResizing = true,
    enableColumnReordering = true,
    enableColumnPinning = true,
    enableColumnPicker = true,
    enableEditing = true,
    enableRangeSelection = true,
    enableGrouping = true,
    enableExport = true,
    enableStatusBar = true,
    showToolbar = true,
    responsiveBreakpoint = 640,
    striped = false,
    overscan = 12,
    exportFileName = 'export.csv',
    copyHeadersToClipboard = false,
    clipboardValues = 'formatted',
    defaultColDef,
    initialState,
    toolbarStart,
    toolbarEnd,
    emptyMessage,
    getRowClassName,
    onCellValueChanged,
    onSelectionChanged,
    onSortChanged,
    onFilterChanged,
    onGroupingChanged,
    onColumnStateChanged,
    onRowClicked,
    onRowDoubleClicked,
    onCopy,
    onRetry,
  } = props

  const gridId = useId().replace(/:/g, '')
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowHeight = rowHeightProp ?? DENSITY[density].row
  const headerHeight = DENSITY[density].header

  // ---- data & edits -------------------------------------------------------
  const [data, setData] = useState(rowData)
  const [prevRowData, setPrevRowData] = useState(rowData)
  const [dirty, setDirty] = useState<Map<string, unknown>>(() => new Map())
  if (rowData !== prevRowData) {
    setPrevRowData(rowData)
    setData(rowData)
    setDirty(new Map())
  }

  // ---- columns ------------------------------------------------------------
  const showCheckbox = checkboxSelection && selectionMode !== 'none'
  const sample = rowData[0]
  const columns = useMemo(
    () =>
      buildColumns(columnDefs, {
        defaultColDef,
        sample,
        checkboxSelection: showCheckbox,
        enableSorting,
        enableFilters,
        enableColumnResizing,
        enableGrouping,
      }),
    [columnDefs, defaultColDef, sample, showCheckbox, enableSorting, enableFilters, enableColumnResizing, enableGrouping],
  )

  const formatterById = useMemo(
    () =>
      new Map<string, NonNullable<ColumnDef<TData>['valueFormatter']>>(
        columns.flatMap((c) => (c.id && c.meta?.def?.valueFormatter ? [[c.id, c.meta.def.valueFormatter] as const] : [])),
      ),
    [columns],
  )
  const globalFilterFn = useMemo(() => createGlobalSearchFn((id) => formatterById.get(id)), [formatterById])

  const defaultPinning = useMemo<ColumnPinningState>(
    () => ({
      left: columnDefs.filter((d) => d.pinned === 'left').map(getColId),
      right: columnDefs.filter((d) => d.pinned === 'right').map(getColId),
    }),
    [columnDefs],
  )
  const defaultVisibility = useMemo<VisibilityState>(
    () => Object.fromEntries(columnDefs.filter((d) => d.hide).map((d) => [getColId(d), false])),
    [columnDefs],
  )

  // ---- grid state ---------------------------------------------------------
  const [sorting, setSorting] = useState<SortingState>(
    () => initialState?.sortModel?.map((s) => ({ id: s.colId, desc: s.sort === 'desc' })) ?? [],
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    Object.entries(initialState?.filterModel ?? {}).map(([id, value]) => ({ id, value })),
  )
  const [globalFilter, setGlobalFilter] = useState(initialState?.globalFilter ?? '')
  // TanStack only re-filters when the filter value changes, so tie it to the formatters too.
  const tableGlobalFilter = useMemo(
    () => (globalFilter ? { query: globalFilter, formatterById } : undefined),
    [globalFilter, formatterById],
  )
  const [grouping, setGrouping] = useState<GroupingState>(initialState?.groupBy ?? [])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(defaultVisibility)
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(defaultPinning)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [paginationState, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialState?.pageSize ?? pageSizeProp,
  })

  useChangeEffect(() => setPagination((p) => ({ pageIndex: 0, pageSize: pageSizeProp ?? p.pageSize })), [pageSizeProp])

  // Drop selections the new mode can't represent (e.g. several rows when switching to single).
  useChangeEffect(() => {
    setRowSelection((prev) => {
      const ids = Object.keys(prev).filter((id) => prev[id])
      if (selectionMode === 'none') return ids.length ? {} : prev
      if (selectionMode === 'single' && ids.length > 1) return { [ids[0]]: true }
      return prev
    })
  }, [selectionMode])

  // On narrow containers, pinned columns would eat the viewport; keep only the checkbox column pinned.
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !responsiveBreakpoint || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setIsNarrow(entry.contentRect.width < responsiveBreakpoint))
    ro.observe(el)
    return () => ro.disconnect()
  }, [responsiveBreakpoint, error])

  const effectivePinning = useMemo<ColumnPinningState>(() => {
    const select = showCheckbox ? [SELECT_COLUMN_ID] : []
    if (isNarrow) return { left: select, right: [] }
    const left = (columnPinning.left ?? []).filter((id) => id !== SELECT_COLUMN_ID)
    return { left: [...select, ...left], right: columnPinning.right ?? [] }
  }, [columnPinning, showCheckbox, isNarrow])

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: tableGlobalFilter,
      grouping: enableGrouping ? grouping : [],
      expanded,
      rowSelection: selectionMode === 'none' ? {} : rowSelection,
      columnVisibility,
      columnOrder,
      columnPinning: effectivePinning,
      columnSizing,
      pagination: paginationState,
    },
    initialState: { columnPinning: defaultPinning, columnVisibility: defaultVisibility },
    getRowId: (row, index) => {
      if (getRowId) return getRowId(row, index)
      const id = (row as any)?.id
      return id != null ? String(id) : String(index)
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (u) => {
      const next = resolve<unknown>(u, tableGlobalFilter)
      setGlobalFilter(typeof next === 'string' ? next : ((next as { query?: string } | undefined)?.query ?? ''))
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
    onColumnPinningChange: (u) =>
      setColumnPinning((prev) => {
        // Resolve against the saved pins, not the narrow-screen view, so suspended pins survive.
        const next = resolve(u, prev)
        return { left: (next.left ?? []).filter((id) => id !== SELECT_COLUMN_ID), right: next.right ?? [] }
      }),
    enableRowSelection: selectionMode !== 'none',
    enableMultiRowSelection: selectionMode === 'multiple',
    enableSubRowSelection: selectionMode === 'multiple',
    enableSorting,
    enableMultiSort,
    isMultiSortEvent: (e) => !!(e as MouseEvent)?.shiftKey,
    sortDescFirst: false,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableGrouping,
    groupedColumnMode: 'reorder',
    enableColumnPinning: true,
    autoResetPageIndex: false,
    autoResetExpanded: false,
    manualPagination: !pagination,
    globalFilterFn,
    getColumnCanGlobalFilter: (column) => !column.columnDef.meta?.isSelect,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const rows = table.getRowModel().rows
  const visibleColumns = table.getVisibleLeafColumns()
  const colIndexById = useMemo(() => new Map(visibleColumns.map((c, i) => [c.id, i])), [visibleColumns])
  const totalWidth = table.getTotalSize()
  const leftWidth = table.getLeftTotalSize()
  const rightWidth = table.getRightTotalSize()
  const filteredRowCount = table.getFilteredRowModel().rows.length
  const pageRowTotal = table.getPrePaginationRowModel().rows.length
  const lastPageIndex = Math.max(0, Math.ceil(pageRowTotal / paginationState.pageSize) - 1)
  // Keep the page in range when rowData, filters or edits shrink the row count.
  useEffect(() => {
    if (pagination && paginationState.pageIndex > lastPageIndex)
      setPagination((p) => ({ ...p, pageIndex: lastPageIndex }))
  }, [pagination, paginationState.pageIndex, lastPageIndex])
  const selectedCount = Object.keys(rowSelection).length ? table.getSelectedRowModel().flatRows.length : 0
  const isFiltered = columnFilters.length > 0 || !!globalFilter

  // ---- virtualization -----------------------------------------------------
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
    scrollMargin: headerHeight,
  })
  useEffect(() => {
    rowVirtualizer.measure()
  }, [rowHeight, headerHeight, rowVirtualizer])

  // ---- cell focus, range & editing -----------------------------------------
  const [focusCell, setFocusCell] = useState<CellPos | null>(null)
  const [anchor, setAnchor] = useState<CellPos | null>(null)
  const [editing, setEditing] = useState<EditingCell | null>(null)
  const [hasFocus, setHasFocus] = useState(false)
  const [toast, setToast] = useState('')
  const dragging = useRef(false)
  const lastClickedRow = useRef<number | null>(null)

  const rowCount = rows.length
  const colCount = visibleColumns.length
  const fc = focusCell && rowCount && colCount
    ? { r: clamp(focusCell.r, 0, rowCount - 1), c: clamp(focusCell.c, 0, colCount - 1) }
    : null
  const an = anchor && rowCount && colCount && enableRangeSelection
    ? { r: clamp(anchor.r, 0, rowCount - 1), c: clamp(anchor.c, 0, colCount - 1) }
    : fc
  const range = useMemo(
    () =>
      fc && an
        ? { r0: Math.min(fc.r, an.r), r1: Math.max(fc.r, an.r), c0: Math.min(fc.c, an.c), c1: Math.max(fc.c, an.c) }
        : null,
    [fc?.r, fc?.c, an?.r, an?.c], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const isMultiCellRange = !!range && (range.r0 !== range.r1 || range.c0 !== range.c1)

  useEffect(() => {
    const up = () => {
      dragging.current = false
    }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // Reset paging & cell range when the row set changes shape.
  useChangeEffect(() => {
    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
    setAnchor(null)
  }, [sorting, columnFilters, globalFilter, grouping])

  useChangeEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [paginationState.pageIndex])

  // ---- events -------------------------------------------------------------
  useChangeEffect(() => {
    onSortChanged?.(sorting.map((s) => ({ colId: s.id, sort: s.desc ? 'desc' : 'asc' })))
  }, [sorting])
  useChangeEffect(() => {
    onFilterChanged?.({
      filterModel: Object.fromEntries(columnFilters.map((f) => [f.id, f.value as ColumnFilterValue])),
      globalFilter,
    })
  }, [columnFilters, globalFilter])
  useChangeEffect(() => onGroupingChanged?.(grouping), [grouping])
  useChangeEffect(() => {
    if (onSelectionChanged) onSelectionChanged(table.getSelectedRowModel().flatRows.map((r) => r.original))
  }, [rowSelection])

  const getColumnState = useCallback(
    (): ColumnState[] =>
      table
        .getAllLeafColumns()
        .filter((c) => !c.columnDef.meta?.isSelect)
        .map((c, index) => ({
          colId: c.id,
          width: c.getSize(),
          hide: !c.getIsVisible(),
          pinned: c.getIsPinned() || null,
          index,
        })),
    [table],
  )
  useChangeEffect(() => onColumnStateChanged?.(getColumnState()), [columnOrder, columnVisibility, columnPinning, columnSizing])

  // ---- helpers ------------------------------------------------------------
  const focusGrid = useCallback(() => scrollRef.current?.focus({ preventScroll: true }), [])

  const ensureVisible = useCallback(
    (r: number, c: number) => {
      const el = scrollRef.current
      if (!el) return
      const top = r * rowHeight
      if (top < el.scrollTop) el.scrollTop = top
      else if (top + rowHeight + headerHeight > el.scrollTop + el.clientHeight)
        el.scrollTop = top + rowHeight + headerHeight - el.clientHeight
      const col = visibleColumns[c]
      if (!col || col.getIsPinned()) return
      const start = col.getStart('center')
      const end = start + col.getSize()
      const viewport = el.clientWidth - leftWidth - rightWidth
      if (start < el.scrollLeft) el.scrollLeft = start
      else if (end > el.scrollLeft + viewport) el.scrollLeft = end - viewport
    },
    [rowHeight, headerHeight, visibleColumns, leftWidth, rightWidth],
  )

  const moveTo = useCallback(
    (r: number, c: number, extend = false) => {
      if (!rowCount || !colCount) return
      const pos = { r: clamp(r, 0, rowCount - 1), c: clamp(c, 0, colCount - 1) }
      setFocusCell(pos)
      if (!extend || !enableRangeSelection) setAnchor(pos)
      ensureVisible(pos.r, pos.c)
    },
    [rowCount, colCount, enableRangeSelection, ensureVisible],
  )

  const isCellEditable = useCallback(
    (row: Row<TData>, column: Column<TData, unknown>) => {
      const def = column.columnDef.meta?.def
      if (!enableEditing || !def || row.getIsGrouped()) return false
      // Computed columns can't be written back through `field`; they need an explicit setter.
      if (def.valueGetter && !def.valueSetter) return false
      return typeof def.editable === 'function' ? def.editable(row.original) : !!def.editable
    },
    [enableEditing],
  )

  const startEdit = useCallback(
    (r: number, c: number, initial?: string) => {
      const row = rows[r]
      const column = visibleColumns[c]
      if (!row || !column || !isCellEditable(row, column)) return false
      setEditing({
        rowId: row.id,
        colId: column.id,
        initial: initial ?? toEditorString(row.getValue(column.id), column.columnDef.meta?.editorType),
        typed: initial != null,
      })
      ensureVisible(r, c)
      return true
    },
    [rows, visibleColumns, isCellEditable, ensureVisible],
  )

  const commitEdit = useCallback(
    (row: Row<TData>, column: Column<TData, unknown>, input: string) => {
      const meta = column.columnDef.meta
      const def = meta?.def
      if (!def) return
      const oldValue = row.getValue(column.id)
      let newValue: unknown
      if (def.valueParser) newValue = def.valueParser(input, row.original)
      else if (meta?.editorType === 'number') {
        if (input.trim() === '') newValue = null
        else {
          const n = Number(input)
          if (Number.isNaN(n)) return
          newValue = n
        }
      } else if (meta?.editorType === 'date') {
        newValue = input ? (meta.dataType === 'date' || oldValue instanceof Date ? parseDayKey(input) : input) : null
      } else newValue = input
      if (valuesEqual(oldValue, newValue)) return

      let updated: TData
      try {
        updated = def.valueSetter ? def.valueSetter(row.original, newValue) : setPath(row.original, def.field, newValue)
      } catch (err) {
        console.error('[DataGrid] edit rejected:', err)
        return
      }
      const index = row.index
      setData((prev) => {
        const next = prev.slice()
        next[index] = updated
        return next
      })
      setDirty((prev) => {
        const key = dirtyKey(row.id, column.id)
        const next = new Map(prev)
        if (next.has(key)) {
          if (valuesEqual(next.get(key), newValue)) next.delete(key)
        } else next.set(key, oldValue)
        return next
      })
      onCellValueChanged?.({ rowId: row.id, colId: column.id, field: def.field, oldValue, newValue, data: updated })
    },
    [onCellValueChanged],
  )

  const selectRowRange = useCallback(
    (from: number, to: number) => {
      const [a, b] = from < to ? [from, to] : [to, from]
      setRowSelection((prev) => {
        const next = { ...prev }
        for (let i = a; i <= b; i++) {
          const row = rows[i]
          if (row && !row.getIsGrouped()) next[row.id] = true
        }
        return next
      })
    },
    [rows],
  )

  const toggleRow = useCallback(
    (row: Row<TData>, r: number, shiftKey = false) => {
      if (selectionMode === 'none') return
      if (shiftKey && selectionMode === 'multiple' && lastClickedRow.current != null) selectRowRange(lastClickedRow.current, r)
      else if (row.getIsGrouped()) row.toggleSelected(!row.getIsAllSubRowsSelected())
      else row.toggleSelected()
      lastClickedRow.current = r
    },
    [selectionMode, selectRowRange],
  )

  const announce = useCallback((msg: string) => setToast(msg), [])

  const getRangeText = useCallback(() => {
    if (!range) return null
    const cols = visibleColumns.slice(range.c0, range.c1 + 1).filter((c) => !c.columnDef.meta?.isSelect)
    if (!cols.length) return null
    const lines: string[] = []
    const clean = (s: string) => s.replace(/[\t\r\n]+/g, ' ')
    if (copyHeadersToClipboard) lines.push(cols.map((c) => clean(colName(c))).join('\t'))
    for (let r = range.r0; r <= range.r1; r++) {
      const row = rows[r]
      if (!row) continue
      lines.push(
        cols
          .map((c) => {
            const value = row.getValue(c.id)
            const text =
              clipboardValues === 'formatted' && !row.getIsGrouped()
                ? formatCellValue(c.columnDef.meta?.def, value, row.original)
                : toPlainString(value, 'day')
            return clean(text)
          })
          .join('\t'),
      )
    }
    return { text: lines.join('\n'), rowCount: range.r1 - range.r0 + 1, columnCount: cols.length }
  }, [range, visibleColumns, rows, copyHeadersToClipboard, clipboardValues])

  const copySelection = useCallback(async () => {
    const res = getRangeText()
    if (!res) return
    await copyText(res.text)
    const cells = res.rowCount * res.columnCount
    announce(`Copied ${cells.toLocaleString()} ${cells === 1 ? 'cell' : 'cells'} to clipboard`)
    onCopy?.(res)
  }, [getRangeText, announce, onCopy])

  const getCsv = useCallback(
    (opts: ExportCsvOptions = {}) => {
      const cols = table.getVisibleLeafColumns().filter((c) => !c.columnDef.meta?.isSelect)
      let leafRows = table.getSortedRowModel().flatRows.filter((r) => !r.getIsGrouped())
      if (opts.onlySelected) leafRows = leafRows.filter((r) => r.getIsSelected())
      const lines = [cols.map((c) => escapeCsv(colName(c))).join(',')]
      for (const row of leafRows) lines.push(cols.map((c) => escapeCsv(toPlainString(row.getValue(c.id)))).join(','))
      return lines.join('\r\n')
    },
    [table],
  )

  const exportCsv = useCallback(
    (opts: ExportCsvOptions = {}) => {
      downloadFile(getCsv(opts), opts.fileName ?? exportFileName)
      announce('CSV export started')
    },
    [getCsv, exportFileName, announce],
  )

  const clearFilters = useCallback(() => {
    setColumnFilters([])
    setGlobalFilter('')
  }, [])

  const resetEdits = useCallback(() => {
    setData(rowData)
    setDirty(new Map())
  }, [rowData])

  useImperativeHandle(apiRef, (): DataGridApi<TData> => ({
    exportCsv,
    getCsv,
    copySelectionToClipboard: copySelection,
    getSelectedRows: () => table.getSelectedRowModel().flatRows.map((r) => r.original),
    selectAll: () => table.toggleAllRowsSelected(true),
    deselectAll: () => table.toggleAllRowsSelected(false),
    getFilterModel: () => Object.fromEntries(columnFilters.map((f) => [f.id, f.value as ColumnFilterValue])) as FilterModel,
    setFilterModel: (model) => setColumnFilters(Object.entries(model).map(([id, value]) => ({ id, value }))),
    clearFilters,
    setSortModel: (model) => setSorting(model.map((s) => ({ id: s.colId, desc: s.sort === 'desc' }))),
    setGroupBy: (ids) => setGrouping(ids),
    resetEdits,
    getDirtyCellCount: () => dirty.size,
    getDisplayedRowCount: () => rows.length,
    scrollToRow: (index) => ensureVisible(clamp(index, 0, Math.max(0, rows.length - 1)), 0),
    getColumnState,
  }))

  // ---- range statistics (status bar) --------------------------------------
  const rangeStats = useMemo<RangeStats | null>(() => {
    if (!enableStatusBar || !range || !isMultiCellRange) return null
    const cols = visibleColumns.slice(range.c0, range.c1 + 1).filter((c) => !c.columnDef.meta?.isSelect)
    const cells = (range.r1 - range.r0 + 1) * cols.length
    let numeric = 0
    let sum = 0
    let min = Infinity
    let max = -Infinity
    if (cells <= 2_000_000) {
      for (let r = range.r0; r <= range.r1; r++) {
        const row = rows[r]
        if (!row || row.getIsGrouped()) continue
        for (const c of cols) {
          const v = row.getValue(c.id)
          if (typeof v === 'number' && !Number.isNaN(v)) {
            numeric++
            sum += v
            if (v < min) min = v
            if (v > max) max = v
          }
        }
      }
    }
    return { cells, numeric, sum, avg: numeric ? sum / numeric : 0, min, max }
  }, [enableStatusBar, range?.r0, range?.r1, range?.c0, range?.c1, isMultiCellRange, visibleColumns, rows]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- keyboard -------------------------------------------------------------
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || editing || loading) return
    if (!rowCount || !colCount) return
    const cur = fc ?? { r: 0, c: 0 }
    const extendFrom = fc ?? cur
    const mod = e.ctrlKey || e.metaKey
    const pageRows = Math.max(1, Math.floor(((scrollRef.current?.clientHeight ?? 400) - headerHeight) / rowHeight) - 1)
    const extend = e.shiftKey && enableRangeSelection

    const go = (r: number, c: number) => {
      e.preventDefault()
      if (extend) {
        if (!anchor) setAnchor(extendFrom)
        moveTo(r, c, true)
      } else moveTo(r, c)
    }

    switch (e.key) {
      case 'ArrowDown':
        return go(mod ? rowCount - 1 : cur.r + 1, cur.c)
      case 'ArrowUp':
        return go(mod ? 0 : cur.r - 1, cur.c)
      case 'ArrowRight':
        return go(cur.r, mod ? colCount - 1 : cur.c + 1)
      case 'ArrowLeft':
        return go(cur.r, mod ? 0 : cur.c - 1)
      case 'PageDown':
        return go(cur.r + pageRows, cur.c)
      case 'PageUp':
        return go(cur.r - pageRows, cur.c)
      case 'Home':
        return go(mod ? 0 : cur.r, 0)
      case 'End':
        return go(mod ? rowCount - 1 : cur.r, colCount - 1)
      case 'Tab': {
        const dir = e.shiftKey ? -1 : 1
        const nc = cur.c + dir
        if (nc >= 0 && nc < colCount) {
          e.preventDefault()
          moveTo(cur.r, nc)
        } else if (cur.r + dir >= 0 && cur.r + dir < rowCount) {
          e.preventDefault()
          moveTo(cur.r + dir, dir > 0 ? 0 : colCount - 1)
        }
        return
      }
      case 'Enter':
      case 'F2': {
        e.preventDefault()
        const row = rows[cur.r]
        if (row?.getIsGrouped()) row.toggleExpanded()
        else startEdit(cur.r, cur.c)
        return
      }
      case ' ': {
        e.preventDefault()
        const row = rows[cur.r]
        if (row) toggleRow(row, cur.r, e.shiftKey)
        return
      }
      case 'Escape':
        if (isMultiCellRange) {
          e.preventDefault()
          setAnchor(fc)
        }
        return
      case 'Backspace':
      case 'Delete':
        if (startEdit(cur.r, cur.c, '')) e.preventDefault()
        return
    }

    if (mod && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault()
      void copySelection()
      return
    }
    if (mod && (e.key === 'a' || e.key === 'A') && enableRangeSelection) {
      e.preventDefault()
      setAnchor({ r: 0, c: 0 })
      setFocusCell({ r: rowCount - 1, c: colCount - 1 })
      return
    }
    if (e.key.length === 1 && !mod && !e.altKey) {
      const column = visibleColumns[cur.c]
      const type = column?.columnDef.meta?.editorType
      const typed = type === 'text' || type === 'number' ? e.key : undefined
      if (startEdit(cur.r, cur.c, typed)) e.preventDefault()
    }
  }

  // ---- column drag & drop ---------------------------------------------------
  const [dragColId, setDragColId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; side: DropSide } | null>(null)

  const dropColumn = (targetId: string, side: DropSide) => {
    const fromId = dragColId
    setDragColId(null)
    setDropTarget(null)
    if (!fromId || fromId === targetId) return
    const target = table.getColumn(targetId)
    if (!target || target.columnDef.meta?.isSelect) return
    const targetPin = target.getIsPinned()
    setColumnPinning((prev) => {
      const left = (prev.left ?? []).filter((id) => id !== fromId)
      const right = (prev.right ?? []).filter((id) => id !== fromId)
      const list = targetPin === 'left' ? left : targetPin === 'right' ? right : null
      if (list) {
        const i = list.indexOf(targetId)
        list.splice(side === 'before' ? i : i + 1, 0, fromId)
      }
      return { left, right }
    })
    const order = table
      .getAllLeafColumns()
      .map((c) => c.id)
      .filter((id) => id !== fromId)
    const i = order.indexOf(targetId)
    order.splice(side === 'before' ? i : i + 1, 0, fromId)
    setColumnOrder(order)
    announce(`Moved ${colName(table.getColumn(fromId)!)} column`)
  }

  // ---- rendering ------------------------------------------------------------
  const pinStyle = (column: Column<TData, unknown>, base: CSSProperties = {}): CSSProperties => {
    const pinned = column.getIsPinned()
    const style: CSSProperties = { ...base, width: column.getSize() }
    if (pinned === 'left') Object.assign(style, { position: 'sticky', left: column.getStart('left'), zIndex: 2 })
    if (pinned === 'right') Object.assign(style, { position: 'sticky', right: column.getAfter('right'), zIndex: 2 })
    return style
  }
  const pinnedEdge = (column: Column<TData, unknown>) =>
    column.getIsPinned() === 'left' && column.getIsLastColumn('left')
      ? 'left'
      : column.getIsPinned() === 'right' && column.getIsFirstColumn('right')
        ? 'right'
        : undefined

  const cellId = (r: number, c: number) => `${gridId}-cell-${r}-${c}`

  const renderHeaderCell = (header: ReturnType<typeof table.getLeftHeaderGroups>[number]['headers'][number]) => {
    const column = header.column
    return (
      <HeaderCell
        key={header.id}
        header={header}
        table={table}
        colIndex={colIndexById.get(column.id) ?? 0}
        style={pinStyle(column, column.getIsPinned() ? { zIndex: 3 } : {})}
        pinnedEdge={pinnedEdge(column)}
        multiSelect={selectionMode === 'multiple'}
        enableColumnReordering={enableColumnReordering}
        enableColumnPinning={enableColumnPinning}
        enableGrouping={enableGrouping}
        isDragging={dragColId === column.id}
        dropSide={dropTarget?.id === column.id && dragColId !== column.id ? dropTarget.side : undefined}
        onDragStartColumn={setDragColId}
        onDragOverColumn={(id, side) =>
          setDropTarget((prev) => (prev?.id === id && prev.side === side ? prev : { id, side }))
        }
        onDropColumn={dropColumn}
        onDragEndColumn={() => {
          setDragColId(null)
          setDropTarget(null)
        }}
      />
    )
  }

  const renderCellContent = (row: Row<TData>, cell: Cell<TData, unknown>, r: number): ReactNode => {
    const column = cell.column
    const meta = column.columnDef.meta
    if (meta?.isSelect) {
      const checked = row.getIsGrouped()
        ? row.getIsAllSubRowsSelected()
          ? true
          : row.getIsSomeSelected()
            ? 'indeterminate'
            : false
        : row.getIsSelected()
      return (
        <Checkbox
          tabIndex={-1}
          aria-label={`Select row ${r + 1}`}
          checked={checked}
          disabled={!row.getCanSelect()}
          onClick={(e) => {
            e.stopPropagation()
            toggleRow(row, r, e.shiftKey)
          }}
        />
      )
    }
    const def = meta?.def
    if (cell.getIsGrouped()) {
      const value = cell.getValue()
      const label = formatCellValue(def, value, row.original) || '(Blank)'
      return (
        <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: row.depth * 20 }}>
          <button
            type="button"
            tabIndex={-1}
            aria-label={row.getIsExpanded() ? `Collapse ${label}` : `Expand ${label}`}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-on-surface/[0.08]"
            onClick={(e) => {
              e.stopPropagation()
              row.toggleExpanded()
            }}
          >
            <ChevronRight className={cn('size-4 transition-transform', row.getIsExpanded() && 'rotate-90')} />
          </button>
          <span className="truncate text-title-small text-on-surface">{label}</span>
          <span className="shrink-0 text-label-medium text-on-surface-variant">({row.getLeafRows().filter((r) => !r.getIsGrouped()).length.toLocaleString()})</span>
        </div>
      )
    }
    if (cell.getIsAggregated()) {
      const value = cell.getValue()
      if (value == null || !def?.aggFunc) return null
      const text =
        def.aggFunc === 'count' ? Number(value).toLocaleString() : formatCellValue(def, value, undefined)
      return (
        <span className="truncate font-medium tabular-nums">
          <span className="mr-1 text-label-small text-on-surface-variant">{AGG_LABEL[def.aggFunc]}</span>
          {text}
        </span>
      )
    }
    if (cell.getIsPlaceholder()) return null

    if (editing && editing.rowId === row.id && editing.colId === column.id) {
      const c = colIndexById.get(column.id) ?? 0
      return (
        <CellEditor
          type={meta?.editorType ?? 'text'}
          initialValue={editing.initial}
          startedByTyping={editing.typed}
          options={def?.cellEditorOptions}
          align={meta?.align}
          label={`Edit ${colName(column)}`}
          onCommit={(value, move: EditorMove) => {
            commitEdit(row, column, value)
            setEditing(null)
            if (move) {
              focusGrid()
              if (move === 'down') moveTo(r + 1, c)
              else if (move === 'up') moveTo(r - 1, c)
              else if (move === 'right') moveTo(c + 1 < colCount ? r : r + 1, c + 1 < colCount ? c + 1 : 0)
              else moveTo(c - 1 >= 0 ? r : r - 1, c - 1 >= 0 ? c - 1 : colCount - 1)
            }
          }}
          onCancel={() => {
            setEditing(null)
            focusGrid()
          }}
        />
      )
    }

    const value = cell.getValue()
    const formattedValue = formatCellValue(def, value, row.original)
    if (def?.cellRenderer) {
      return def.cellRenderer({
        value,
        formattedValue,
        data: row.original,
        rowId: row.id,
        rowIndex: r,
        colId: column.id,
        column: def,
      })
    }
    return <span className={cn('truncate', meta?.align === 'right' && 'tabular-nums')}>{formattedValue}</span>
  }

  const renderCell = (row: Row<TData>, cell: Cell<TData, unknown>, r: number) => {
    const column = cell.column
    const c = colIndexById.get(column.id) ?? 0
    const meta = column.columnDef.meta
    const def = meta?.def
    const inRange = !!range && isMultiCellRange && r >= range.r0 && r <= range.r1 && c >= range.c0 && c <= range.c1
    const isFocused = !!fc && fc.r === r && fc.c === c
    const isEditing = !!editing && editing.rowId === row.id && editing.colId === column.id
    const editable = isCellEditable(row, column)
    const isDirty = dirty.size > 0 && dirty.has(dirtyKey(row.id, column.id))
    const extraClass =
      def?.cellClass && !row.getIsGrouped()
        ? typeof def.cellClass === 'function'
          ? def.cellClass({
              value: cell.getValue(),
              formattedValue: '',
              data: row.original,
              rowId: row.id,
              rowIndex: r,
              colId: column.id,
              column: def,
            })
          : def.cellClass
        : undefined

    return (
      <div
        key={cell.id}
        id={cellId(r, c)}
        role="gridcell"
        aria-colindex={c + 1}
        aria-selected={enableRangeSelection ? inRange || isFocused : undefined}
        aria-readonly={meta?.isSelect ? undefined : !editable}
        className={cn(
          'dg-cell text-body-medium text-on-surface',
          meta?.align === 'right' && 'justify-end text-right',
          meta?.align === 'center' && 'justify-center',
          editable && 'cursor-cell',
          extraClass,
        )}
        data-in-range={inRange || undefined}
        data-focused={(isFocused && hasFocus && !isEditing) || undefined}
        data-dirty={isDirty || undefined}
        data-editing={isEditing || undefined}
        data-pinned-edge={pinnedEdge(column)}
        title={isDirty ? `Edited (was: ${toPlainString(dirty.get(dirtyKey(row.id, column.id)), 'day') || 'blank'})` : undefined}
        style={pinStyle(column)}
        onMouseDown={(e) => {
          if (e.button !== 0) return
          if (!editing) {
            e.preventDefault()
            focusGrid()
          }
          if (e.shiftKey && enableRangeSelection && fc) {
            if (!anchor) setAnchor(fc)
            setFocusCell({ r, c })
          } else {
            setAnchor({ r, c })
            setFocusCell({ r, c })
          }
          dragging.current = enableRangeSelection
        }}
        onMouseEnter={() => {
          if (dragging.current) setFocusCell({ r, c })
        }}
        onDoubleClick={() => {
          if (editable) startEdit(r, c)
        }}
      >
        {renderCellContent(row, cell, r)}
      </div>
    )
  }

  const rowIndexOffset = pagination ? paginationState.pageIndex * paginationState.pageSize : 0

  const renderRow = (vr: VirtualItem) => {
    const row = rows[vr.index]
    if (!row) return null
    const r = vr.index
    const isSelected = row.getIsSelected() || (row.getIsGrouped() && row.getIsAllSubRowsSelected())
    const isGroup = row.getIsGrouped()
    return (
      <div
        key={row.id}
        role="row"
        aria-rowindex={rowIndexOffset + r + 2}
        aria-selected={selectionMode !== 'none' ? isSelected : undefined}
        aria-level={grouping.length ? row.depth + 1 : undefined}
        aria-expanded={isGroup ? row.getIsExpanded() : undefined}
        className={cn('dg-row', !isGroup && getRowClassName?.(row.original, r))}
        data-striped={(striped && r % 2 === 1) || undefined}
        data-selected={isSelected || undefined}
        data-group={isGroup || undefined}
        style={{ height: rowHeight, transform: `translateY(${vr.start - headerHeight}px)` }}
        onClick={(e) => {
          if (!isGroup) onRowClicked?.({ rowId: row.id, rowIndex: r, data: row.original, event: e })
          if (selectionMode === 'none' || !selectOnRowClick || isGroup) return
          if (selectionMode === 'single') row.toggleSelected(e.ctrlKey || e.metaKey ? !row.getIsSelected() : true)
          else if (e.shiftKey && lastClickedRow.current != null) selectRowRange(lastClickedRow.current, r)
          else if (e.ctrlKey || e.metaKey) row.toggleSelected()
          else setRowSelection({ [row.id]: true })
          if (!e.shiftKey) lastClickedRow.current = r
        }}
        onDoubleClick={(e) => {
          if (!isGroup) onRowDoubleClicked?.({ rowId: row.id, rowIndex: r, data: row.original, event: e })
        }}
      >
        {row.getLeftVisibleCells().map((cell) => renderCell(row, cell, r))}
        {row.getCenterVisibleCells().map((cell) => renderCell(row, cell, r))}
        <div className="dg-filler" aria-hidden />
        {row.getRightVisibleCells().map((cell) => renderCell(row, cell, r))}
      </div>
    )
  }

  const headerGroups = {
    left: table.getLeftHeaderGroups()[0]?.headers ?? [],
    center: table.getCenterHeaderGroups()[0]?.headers ?? [],
    right: table.getRightHeaderGroups()[0]?.headers ?? [],
  }

  const showEmpty = !loading && !error && rows.length === 0

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface text-on-surface shadow-elevation-1',
        className,
      )}
      style={{ height }}
    >
      {showToolbar && !error && (
        <GridToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          enableGlobalSearch={enableGlobalSearch}
          enableFilters={enableFilters}
          enableGrouping={enableGrouping}
          enableColumnPicker={enableColumnPicker}
          enableExport={enableExport}
          dirtyCount={dirty.size}
          selectedCount={selectedCount}
          onResetEdits={resetEdits}
          onExport={(onlySelected) => exportCsv({ onlySelected })}
          onClearFilters={clearFilters}
          start={toolbarStart}
          end={toolbarEnd}
        />
      )}

      <div className="relative min-h-0 flex-1">
        {error ? (
          <ErrorState error={error} onRetry={onRetry} />
        ) : (
          <div
            ref={scrollRef}
            role="grid"
            aria-label={ariaLabel}
            aria-rowcount={loading ? -1 : pageRowTotal + 1}
            aria-colcount={colCount}
            aria-multiselectable={selectionMode === 'multiple' || enableRangeSelection || undefined}
            aria-busy={loading || undefined}
            aria-activedescendant={hasFocus && fc && !editing ? cellId(fc.r, fc.c) : undefined}
            tabIndex={0}
            className="h-full overflow-auto overscroll-contain focus-visible:outline-none"
            onKeyDown={onKeyDown}
            onFocus={(e) => {
              if (e.target !== e.currentTarget) return
              setHasFocus(true)
              if (!focusCell && rowCount) setFocusCell({ r: 0, c: 0 })
            }}
            onBlur={(e) => {
              if (e.target === e.currentTarget) setHasFocus(false)
            }}
          >
            <div role="rowgroup" className="dg-header" style={{ height: headerHeight, width: totalWidth, minWidth: '100%' }}>
              <div role="row" aria-rowindex={1} className="flex h-full w-full">
                {headerGroups.left.map(renderHeaderCell)}
                {headerGroups.center.map(renderHeaderCell)}
                <div className="dg-filler bg-surface-container" aria-hidden />
                {headerGroups.right.map(renderHeaderCell)}
              </div>
            </div>

            {loading ? (
              <SkeletonRows
                rowCount={Math.max(8, Math.ceil(800 / rowHeight))}
                rowHeight={rowHeight}
                widths={visibleColumns.map((c) => c.getSize())}
              />
            ) : (
              <div
                role="rowgroup"
                className="relative"
                style={{ height: rowVirtualizer.getTotalSize(), width: totalWidth, minWidth: '100%' }}
              >
                {rowVirtualizer.getVirtualItems().map(renderRow)}
              </div>
            )}
          </div>
        )}

        {showEmpty && (
          <div className="absolute inset-x-0 bottom-0" style={{ top: headerHeight }}>
            <EmptyState filtered={isFiltered} message={emptyMessage} onClearFilters={clearFilters} />
          </div>
        )}

        <div
          aria-live="polite"
          role="status"
          className={cn(
            'pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-md bg-on-surface px-4 py-3 text-body-medium text-surface shadow-elevation-3 transition-all duration-200',
            toast ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        >
          {toast}
        </div>
      </div>

      {!error && (
        <GridFooter
          table={table}
          totalRows={data.length}
          filteredRows={filteredRowCount}
          pageRowTotal={pageRowTotal}
          selectedCount={selectedCount}
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
          rangeStats={rangeStats}
          showStatus={enableStatusBar}
        />
      )}
    </div>
  )
}
