/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CellRendererParams } from './types'

export type BadgeTone = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'

const dotColor: Record<BadgeTone, string> = {
  default: 'bg-primary-foreground',
  secondary: 'bg-secondary-container-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-primary',
  outline: 'bg-on-surface-variant',
}

/** Ready-made `cellRenderer` factories. */
export const cellRenderers = {
  /** Status chip coloured by value. */
  badge<TData = any>(options: { tones?: Record<string, BadgeTone>; defaultTone?: BadgeTone; dot?: boolean } = {}) {
    const { tones = {}, defaultTone = 'outline', dot = true } = options
    return function BadgeCell(p: CellRendererParams<TData>): ReactNode {
      if (!p.formattedValue) return null
      const tone = tones[String(p.value)] ?? defaultTone
      return (
        <Badge variant={tone} className="max-w-full">
          {dot && <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', dotColor[tone])} />}
          <span className="truncate">{p.formattedValue}</span>
        </Badge>
      )
    }
  },

  /** Linear progress indicator with a numeric label. */
  progress<TData = any>(
    options: { max?: number; showLabel?: boolean; thresholds?: { low: number; high: number } } = {},
  ) {
    const { max = 100, showLabel = true, thresholds = { low: 40, high: 75 } } = options
    return function ProgressCell(p: CellRendererParams<TData>): ReactNode {
      if (p.value == null || p.value === '') return null
      const pct = Math.max(0, Math.min(100, (Number(p.value) / max) * 100))
      const tone = pct < thresholds.low ? 'bg-destructive' : pct < thresholds.high ? 'bg-warning' : 'bg-success'
      return (
        <div className="flex w-full items-center gap-2">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-highest"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Number(p.value)}
          >
            <div className={cn('h-full rounded-full transition-[width]', tone)} style={{ width: `${pct}%` }} />
          </div>
          {showLabel && (
            <span className="w-9 shrink-0 text-right text-label-medium tabular-nums text-on-surface-variant">
              {p.formattedValue || `${Math.round(pct)}%`}
            </span>
          )}
        </div>
      )
    }
  },

  /** Anchor link. */
  link<TData = any>(options: { href: (data: TData, value: any) => string; external?: boolean }) {
    const { href, external = false } = options
    return function LinkCell(p: CellRendererParams<TData>): ReactNode {
      if (!p.formattedValue) return null
      return (
        <a
          href={href(p.data, p.value)}
          className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-2 hover:underline"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        >
          <span className="truncate">{p.formattedValue}</span>
          {external && <ExternalLink aria-hidden className="size-3 shrink-0" />}
        </a>
      )
    }
  },

  /** Avatar initials followed by the value. */
  avatar<TData = any>(options: { subtitle?: (data: TData) => string } = {}) {
    return function AvatarCell(p: CellRendererParams<TData>): ReactNode {
      const text = p.formattedValue
      if (!text) return null
      const initials = text
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join('')
        .toUpperCase()
      let hash = 0
      for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0
      const hue = Math.abs(hash) % 360
      return (
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-label-small text-white"
            style={{ backgroundColor: `hsl(${hue} 45% 45%)` }}
          >
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate">{text}</span>
            {options.subtitle && (
              <span className="block truncate text-body-small text-on-surface-variant">
                {options.subtitle(p.data)}
              </span>
            )}
          </span>
        </div>
      )
    }
  },
}
