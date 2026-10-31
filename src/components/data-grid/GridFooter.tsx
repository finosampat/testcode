/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Table } from '@tanstack/react-table'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface RangeStats {
  cells: number
  numeric: number
  sum: number
  avg: number
  min: number
  max: number
}

const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export function GridFooter({
  table,
  totalRows,
  filteredRows,
  pageRowTotal,
  selectedCount,
  pagination,
  pageSizeOptions,
  rangeStats,
  showStatus,
}: {
  table: Table<any>
  totalRows: number
  filteredRows: number
  /** Rows available to paginate (includes expanded group rows). */
  pageRowTotal: number
  selectedCount: number
  pagination: boolean
  pageSizeOptions: number[]
  rangeStats: RangeStats | null
  showStatus: boolean
}) {
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = Math.max(1, table.getPageCount())
  const from = pageRowTotal === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(pageRowTotal, (pageIndex + 1) * pageSize)

  if (!showStatus && !pagination) return null

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-outline-variant bg-surface-container-low px-4 py-2 text-body-small text-on-surface-variant">
      {showStatus && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" role="status" aria-live="polite">
          <span>
            Rows: <strong className="font-medium text-on-surface tabular-nums">{filteredRows.toLocaleString()}</strong>
            {filteredRows !== totalRows && <> of {totalRows.toLocaleString()}</>}
          </span>
          {selectedCount > 0 && (
            <span>
              Selected: <strong className="font-medium text-on-surface tabular-nums">{selectedCount.toLocaleString()}</strong>
            </span>
          )}
          {rangeStats && rangeStats.cells > 1 && (
            <>
              <span>
                Count: <strong className="font-medium text-on-surface tabular-nums">{rangeStats.cells.toLocaleString()}</strong>
              </span>
              {rangeStats.numeric > 0 && (
                <>
                  <span>
                    Sum: <strong className="font-medium text-on-surface tabular-nums">{nf.format(rangeStats.sum)}</strong>
                  </span>
                  <span>
                    Avg: <strong className="font-medium text-on-surface tabular-nums">{nf.format(rangeStats.avg)}</strong>
                  </span>
                  <span className="hidden md:inline">
                    Min: <strong className="font-medium text-on-surface tabular-nums">{nf.format(rangeStats.min)}</strong>
                  </span>
                  <span className="hidden md:inline">
                    Max: <strong className="font-medium text-on-surface tabular-nums">{nf.format(rangeStats.max)}</strong>
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {pagination && (
        <nav className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Pagination">
          <div className="flex items-center gap-2">
            <span id="dg-page-size-label">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[84px]" aria-labelledby="dg-page-size-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="tabular-nums">
            {from.toLocaleString()}–{to.toLocaleString()} of {pageRowTotal.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="First page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.firstPage()}
            >
              <ChevronFirst />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft />
            </Button>
            <span className="px-2 tabular-nums" aria-current="page">
              Page {(pageIndex + 1).toLocaleString()} of {pageCount.toLocaleString()}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Last page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.lastPage()}
            >
              <ChevronLast />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
