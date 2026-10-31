/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AggregationFnOption, ColumnDef as TanstackColumnDef, RowData, SortingFnOption } from '@tanstack/react-table'

import { gridFilterFn } from './filters'
import type { AggFunc, CellAlign, CellDataType, CellEditorType, ColumnDef, FilterType } from './types'
import { getPath, startCase } from './utils'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    def?: ColumnDef<TData, TValue>
    dataType?: CellDataType
    filterType?: FilterType
    editorType?: CellEditorType
    align?: CellAlign
    isSelect?: boolean
  }
}

export const SELECT_COLUMN_ID = '__select__'

const aggMap: Record<AggFunc, AggregationFnOption<any>> = {
  sum: 'sum',
  avg: 'mean',
  count: 'count',
  min: 'min',
  max: 'max',
}

export function inferDataType(value: unknown): CellDataType {
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value instanceof Date) return 'date'
  return 'text'
}

export function getColId(def: ColumnDef): string {
  return def.colId ?? def.field
}

export interface BuildColumnsOptions<TData> {
  defaultColDef?: Partial<ColumnDef<TData>>
  sample?: TData
  checkboxSelection: boolean
  enableSorting: boolean
  enableFilters: boolean
  enableColumnResizing: boolean
  enableGrouping: boolean
}

export function buildColumns<TData>(
  defs: ColumnDef<TData>[],
  opts: BuildColumnsOptions<TData>,
): TanstackColumnDef<TData, any>[] {
  const columns: TanstackColumnDef<TData, any>[] = []

  if (opts.checkboxSelection) {
    columns.push({
      id: SELECT_COLUMN_ID,
      header: 'Select',
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableSorting: false,
      enableColumnFilter: false,
      enableGlobalFilter: false,
      enableResizing: false,
      enableHiding: false,
      enableGrouping: false,
      enablePinning: false,
      meta: { isSelect: true, align: 'center' },
    })
  }

  for (const raw of defs) {
    const def: ColumnDef<TData> = { ...opts.defaultColDef, ...raw } as ColumnDef<TData>
    const id = getColId(def)
    const accessorFn = def.valueGetter
      ? (row: TData) => def.valueGetter!(row)
      : (row: TData) => getPath(row, def.field)
    const sampleValue = opts.sample ? accessorFn(opts.sample) : undefined
    const dataType = def.dataType ?? inferDataType(sampleValue)
    const filterType: FilterType =
      def.filter ?? (dataType === 'number' ? 'number' : dataType === 'date' ? 'date' : dataType === 'boolean' ? 'set' : 'text')
    const editorType: CellEditorType =
      def.cellEditor ??
      (def.cellEditorOptions ? 'select' : dataType === 'number' ? 'number' : dataType === 'date' ? 'date' : 'text')

    let sortingFn: SortingFnOption<TData> = 'auto'
    if (def.comparator) {
      const cmp = def.comparator
      sortingFn = (a, b, colId) => cmp(a.getValue(colId), b.getValue(colId))
    } else if (dataType === 'number') sortingFn = 'basic'
    else if (dataType === 'date') sortingFn = 'datetime'
    else if (dataType === 'text') sortingFn = 'text'

    columns.push({
      id,
      accessorFn,
      header: def.headerName ?? startCase(def.field),
      size: def.width ?? 160,
      minSize: def.minWidth ?? 64,
      maxSize: def.maxWidth ?? 1200,
      enableSorting: opts.enableSorting && def.sortable !== false,
      enableMultiSort: true,
      sortUndefined: 'last',
      enableColumnFilter: opts.enableFilters && def.filterable !== false,
      enableGlobalFilter: true,
      enableResizing: opts.enableColumnResizing && def.resizable !== false,
      enableHiding: !def.lockVisible,
      enableGrouping: opts.enableGrouping && def.enableRowGroup !== false,
      filterFn: gridFilterFn,
      sortingFn,
      aggregationFn: def.aggFunc ? aggMap[def.aggFunc] : undefined,
      meta: {
        def: def as ColumnDef<TData, any>,
        dataType,
        filterType,
        editorType,
        align: def.align ?? (dataType === 'number' ? 'right' : 'left'),
      },
    })
  }
  return columns
}
