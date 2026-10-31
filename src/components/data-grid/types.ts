/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react'

export type PinnedSide = 'left' | 'right'
export type CellDataType = 'text' | 'number' | 'date' | 'boolean'
export type FilterType = 'text' | 'number' | 'date' | 'set'
export type CellEditorType = 'text' | 'number' | 'select' | 'date'
export type AggFunc = 'sum' | 'avg' | 'count' | 'min' | 'max'
export type RowSelectionMode = 'none' | 'single' | 'multiple'
export type GridDensity = 'compact' | 'standard' | 'comfortable'
export type CellAlign = 'left' | 'center' | 'right'

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export type TextFilterOperator =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'notEquals'
  | 'startsWith'
  | 'endsWith'
  | 'blank'
  | 'notBlank'

export type NumberFilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'blank' | 'notBlank'

export type DateFilterOperator = 'on' | 'before' | 'after' | 'between' | 'blank' | 'notBlank'

export interface TextFilterValue {
  type: 'text'
  operator: TextFilterOperator
  value: string
}

export interface NumberFilterValue {
  type: 'number'
  operator: NumberFilterOperator
  value: number | null
  /** Upper bound (inclusive) for the `between` operator. */
  valueTo?: number | null
}

export interface DateFilterValue {
  type: 'date'
  operator: DateFilterOperator
  /** Calendar day in `YYYY-MM-DD` format. */
  value: string
  /** Upper bound (inclusive) in `YYYY-MM-DD` format for the `between` operator. */
  valueTo?: string
}

export interface SetFilterValue {
  type: 'set'
  /** Values that are allowed through the filter. */
  values: string[]
}

export type ColumnFilterValue = TextFilterValue | NumberFilterValue | DateFilterValue | SetFilterValue

/** Column filters keyed by column id. */
export type FilterModel = Record<string, ColumnFilterValue>

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

export interface CellRendererParams<TData = any, TValue = any> {
  value: TValue
  /** Value after `valueFormatter` (or default formatting) is applied. */
  formattedValue: string
  data: TData
  rowId: string
  rowIndex: number
  colId: string
  column: ColumnDef<TData, TValue>
}

export interface ColumnDef<TData = any, TValue = any> {
  /** Property of the row object to read. Dot paths (`address.city`) are supported. */
  field: string
  /** Unique column id. Defaults to `field`. */
  colId?: string
  /** Header label. Defaults to a title-cased `field`. */
  headerName?: string
  headerTooltip?: string
  /** Data type, used to infer default filter, editor, alignment and sorting. Inferred from data when omitted. */
  dataType?: CellDataType

  width?: number
  minWidth?: number
  maxWidth?: number
  align?: CellAlign

  sortable?: boolean
  /** Custom sort comparator. */
  comparator?: (a: TValue, b: TValue) => number

  filterable?: boolean
  /** Filter UI to use. Inferred from `dataType` when omitted. */
  filter?: FilterType
  /** Options for the set filter. Derived from the data when omitted. */
  filterOptions?: string[]

  editable?: boolean | ((data: TData) => boolean)
  /** Editor UI to use. Inferred from `dataType` / `cellEditorOptions` when omitted. */
  cellEditor?: CellEditorType
  /** Options for the `select` editor. */
  cellEditorOptions?: string[]
  /** Convert editor input into the stored value. */
  valueParser?: (input: string, data: TData) => TValue
  /** Write a new value into the row. Defaults to setting `field` on a shallow copy of the row. */
  valueSetter?: (data: TData, value: TValue) => TData

  pinned?: PinnedSide | null
  hide?: boolean
  resizable?: boolean
  /** Prevent the column from being dragged to a new position. */
  lockPosition?: boolean
  /** Prevent the column from being hidden via the column picker. */
  lockVisible?: boolean

  /** Compute the cell value from the row instead of reading `field`. */
  valueGetter?: (data: TData) => TValue
  /** Format the value for display, copy and search. `data` is undefined for aggregated cells. */
  valueFormatter?: (value: TValue, data: TData | undefined) => string
  /** Render custom cell content. */
  cellRenderer?: (params: CellRendererParams<TData, TValue>) => ReactNode
  /** Extra class names for body cells. */
  cellClass?: string | ((params: CellRendererParams<TData, TValue>) => string | undefined)

  /** Allow grouping by this column. Defaults to true. */
  enableRowGroup?: boolean
  /** Aggregation shown on group rows. */
  aggFunc?: AggFunc
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface SortModelItem {
  colId: string
  sort: 'asc' | 'desc'
}

export interface CellValueChangedEvent<TData = any> {
  rowId: string
  colId: string
  field: string
  oldValue: unknown
  newValue: unknown
  /** Row data after the change. */
  data: TData
}

export interface RowEvent<TData = any> {
  rowId: string
  rowIndex: number
  data: TData
  event: React.MouseEvent
}

export interface FilterChangedEvent {
  filterModel: FilterModel
  globalFilter: string
}

export interface CopyEvent {
  text: string
  rowCount: number
  columnCount: number
}

export interface ColumnState {
  colId: string
  width: number
  hide: boolean
  pinned: PinnedSide | null
  /** Position in the column order. */
  index: number
}

export interface DataGridEvents<TData = any> {
  onCellValueChanged?: (event: CellValueChangedEvent<TData>) => void
  onSelectionChanged?: (selectedRows: TData[]) => void
  onSortChanged?: (sortModel: SortModelItem[]) => void
  onFilterChanged?: (event: FilterChangedEvent) => void
  onGroupingChanged?: (groupBy: string[]) => void
  onColumnStateChanged?: (state: ColumnState[]) => void
  onRowClicked?: (event: RowEvent<TData>) => void
  onRowDoubleClicked?: (event: RowEvent<TData>) => void
  onCopy?: (event: CopyEvent) => void
  /** Called by the error state's retry button. */
  onRetry?: () => void
}

// ---------------------------------------------------------------------------
// Options & props
// ---------------------------------------------------------------------------

export interface DataGridInitialState {
  sortModel?: SortModelItem[]
  filterModel?: FilterModel
  globalFilter?: string
  groupBy?: string[]
  pageSize?: number
}

export interface DataGridOptions<TData = any> {
  /** Grid height. Defaults to `600`. Use `'100%'` inside a sized container. */
  height?: number | string
  density?: GridDensity
  /** Overrides the density-based row height. */
  rowHeight?: number

  pagination?: boolean
  pageSize?: number
  pageSizeOptions?: number[]

  rowSelection?: RowSelectionMode
  /** Show a pinned checkbox column (with select-all header) when row selection is enabled. */
  checkboxSelection?: boolean
  /** Select rows by clicking them. Defaults to true. */
  selectOnRowClick?: boolean

  enableSorting?: boolean
  enableMultiSort?: boolean
  enableFilters?: boolean
  enableGlobalSearch?: boolean
  enableColumnResizing?: boolean
  enableColumnReordering?: boolean
  enableColumnPinning?: boolean
  enableColumnPicker?: boolean
  enableEditing?: boolean
  enableRangeSelection?: boolean
  enableGrouping?: boolean
  enableExport?: boolean
  enableStatusBar?: boolean
  showToolbar?: boolean
  /** Container width (px) below which column pinning is suspended (checkbox column stays pinned). `0` disables. Defaults to 640. */
  responsiveBreakpoint?: number

  striped?: boolean
  /** Rows rendered outside the viewport. */
  overscan?: number
  exportFileName?: string
  /** Include headers when copying a cell range. */
  copyHeadersToClipboard?: boolean

  /** Defaults merged into every column definition. */
  defaultColDef?: Partial<ColumnDef<TData>>
  initialState?: DataGridInitialState

  /** Content rendered at the start of the toolbar. */
  toolbarStart?: ReactNode
  /** Content rendered at the end of the toolbar. */
  toolbarEnd?: ReactNode
  emptyMessage?: ReactNode
  getRowClassName?: (data: TData, rowIndex: number) => string | undefined
}

export interface ExportCsvOptions {
  fileName?: string
  onlySelected?: boolean
}

/** Imperative API exposed through the `apiRef` prop. */
export interface DataGridApi<TData = any> {
  exportCsv: (options?: ExportCsvOptions) => void
  getCsv: (options?: ExportCsvOptions) => string
  copySelectionToClipboard: () => Promise<void>
  getSelectedRows: () => TData[]
  selectAll: () => void
  deselectAll: () => void
  getFilterModel: () => FilterModel
  setFilterModel: (model: FilterModel) => void
  clearFilters: () => void
  setSortModel: (model: SortModelItem[]) => void
  setGroupBy: (colIds: string[]) => void
  /** Revert all inline edits to their original values. */
  resetEdits: () => void
  getDirtyCellCount: () => number
  getDisplayedRowCount: () => number
  scrollToRow: (displayIndex: number) => void
  getColumnState: () => ColumnState[]
}

export interface DataGridProps<TData = any> extends DataGridOptions<TData>, DataGridEvents<TData> {
  rowData: TData[]
  columnDefs: ColumnDef<TData>[]
  /** Stable row id. Defaults to `data.id` when present, otherwise the row index. */
  getRowId?: (data: TData, index: number) => string
  loading?: boolean
  error?: string | Error | null
  apiRef?: React.Ref<DataGridApi<TData>>
  className?: string
  'aria-label'?: string
}
