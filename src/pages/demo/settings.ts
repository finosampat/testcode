import type { GridDensity, RowSelectionMode } from '@/components/data-grid'

export type Simulation = 'none' | 'loading' | 'error' | 'empty'

export interface DemoSettings {
  rowCount: number
  density: GridDensity
  pagination: boolean
  pageSize: number
  rowSelection: RowSelectionMode
  checkboxSelection: boolean
  selectOnRowClick: boolean
  enableSorting: boolean
  enableMultiSort: boolean
  enableFilters: boolean
  enableGlobalSearch: boolean
  enableColumnResizing: boolean
  enableColumnReordering: boolean
  enableColumnPinning: boolean
  enableColumnPicker: boolean
  enableEditing: boolean
  enableRangeSelection: boolean
  enableGrouping: boolean
  enableExport: boolean
  enableStatusBar: boolean
  striped: boolean
  simulate: Simulation
}

export const DEFAULT_SETTINGS: DemoSettings = {
  rowCount: 50_000,
  density: 'standard',
  pagination: false,
  pageSize: 100,
  rowSelection: 'multiple',
  checkboxSelection: true,
  selectOnRowClick: false,
  enableSorting: true,
  enableMultiSort: true,
  enableFilters: true,
  enableGlobalSearch: true,
  enableColumnResizing: true,
  enableColumnReordering: true,
  enableColumnPinning: true,
  enableColumnPicker: true,
  enableEditing: true,
  enableRangeSelection: true,
  enableGrouping: true,
  enableExport: true,
  enableStatusBar: true,
  striped: false,
  simulate: 'none',
}

export const ROW_COUNT_OPTIONS = [1_000, 10_000, 50_000, 100_000, 250_000]
