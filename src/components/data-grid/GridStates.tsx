import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw, SearchX, TableProperties } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonRows({
  rowCount,
  rowHeight,
  widths,
}: {
  rowCount: number
  rowHeight: number
  widths: number[]
}) {
  return (
    <div role="presentation" aria-hidden>
      {Array.from({ length: rowCount }, (_, r) => (
        <div key={r} className="flex border-b border-outline-variant/60" style={{ height: rowHeight }}>
          {widths.map((w, c) => (
            <div key={c} className="flex shrink-0 items-center px-3" style={{ width: w }}>
              <Skeleton className="h-3.5 rounded-full" style={{ width: `${45 + ((r * 7 + c * 13) % 45)}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  filtered,
  message,
  onClearFilters,
}: {
  filtered: boolean
  message?: ReactNode
  onClearFilters?: () => void
}) {
  const Icon = filtered ? SearchX : TableProperties
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center" role="status">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary-container text-secondary-container-foreground">
        <Icon className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-title-medium text-on-surface">{filtered ? 'No matching rows' : 'No rows to display'}</p>
        <p className="max-w-sm text-body-medium text-on-surface-variant">
          {message ??
            (filtered
              ? 'Try adjusting your search or filters to find what you are looking for.'
              : 'There is no data to show yet.')}
        </p>
      </div>
      {filtered && onClearFilters && (
        <Button variant="tonal" size="sm" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: string | Error; onRetry?: () => void }) {
  const message = typeof error === 'string' ? error : error.message
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center" role="alert">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-title-medium text-on-surface">Something went wrong</p>
        <p className="max-w-md text-body-medium text-on-surface-variant">{message || 'Failed to load data.'}</p>
      </div>
      {onRetry && (
        <Button variant="default" size="sm" onClick={onRetry}>
          <RefreshCw /> Retry
        </Button>
      )}
    </div>
  )
}
