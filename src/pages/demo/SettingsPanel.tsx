import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_SETTINGS, ROW_COUNT_OPTIONS, type DemoSettings } from './settings'

type BoolKey = {
  [K in keyof DemoSettings]: DemoSettings[K] extends boolean ? K : never
}[keyof DemoSettings]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="px-1 pb-1 text-title-small text-primary">{title}</h3>
      {children}
    </section>
  )
}

function SelectRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const id = `setting-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-1">
      <Label id={id} className="text-body-large font-normal">
        {label}
      </Label>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange((typeof value === 'number' ? Number(v) : v) as T)}
      >
        <SelectTrigger className="h-9 w-40" aria-labelledby={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SettingsPanel({
  open,
  onOpenChange,
  settings,
  onChange,
  eventLog,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: DemoSettings
  onChange: (next: DemoSettings) => void
  eventLog: string[]
}) {
  const set = <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => onChange({ ...settings, [key]: value })

  const toggle = ({ k, label, hint, disabled }: { k: BoolKey; label: string; hint?: string; disabled?: boolean }) => {
    const id = `setting-${k}`
    return (
      <div key={k} className="flex min-h-12 items-center justify-between gap-4 rounded-lg px-1">
        <div className="min-w-0">
          <Label htmlFor={id} className="text-body-large font-normal">
            {label}
          </Label>
          {hint && <p className="text-body-small text-on-surface-variant">{hint}</p>}
        </div>
        <Switch id={id} checked={settings[k]} disabled={disabled} onCheckedChange={(v) => set(k, v)} />
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Grid settings</SheetTitle>
          <SheetDescription>Toggle DataGrid features live.</SheetDescription>
        </SheetHeader>

        <Section title="Data">
          <SelectRow
            label="Row count"
            value={settings.rowCount}
            options={ROW_COUNT_OPTIONS.map((n) => ({ value: n, label: n.toLocaleString() }))}
            onChange={(v) => set('rowCount', v)}
          />
          <SelectRow
            label="Simulate state"
            value={settings.simulate}
            options={[
              { value: 'none', label: 'Normal' },
              { value: 'loading', label: 'Loading' },
              { value: 'empty', label: 'Empty' },
              { value: 'error', label: 'Error' },
            ]}
            onChange={(v) => set('simulate', v)}
          />
        </Section>
        <Separator />

        <Section title="Layout">
          <SelectRow
            label="Density"
            value={settings.density}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'standard', label: 'Standard' },
              { value: 'comfortable', label: 'Comfortable' },
            ]}
            onChange={(v) => set('density', v)}
          />
          {toggle({ k: 'striped', label: 'Striped rows' })}
          {toggle({ k: 'pagination', label: 'Pagination', hint: 'Off = virtualized infinite scroll' })}
          {settings.pagination && (
            <SelectRow
              label="Page size"
              value={settings.pageSize}
              options={[25, 50, 100, 250, 500, 1000].map((n) => ({ value: n, label: String(n) }))}
              onChange={(v) => set('pageSize', v)}
            />
          )}
          {toggle({ k: 'enableStatusBar', label: 'Status bar' })}
        </Section>
        <Separator />

        <Section title="Selection">
          <SelectRow
            label="Row selection"
            value={settings.rowSelection}
            options={[
              { value: 'none', label: 'None' },
              { value: 'single', label: 'Single' },
              { value: 'multiple', label: 'Multiple' },
            ]}
            onChange={(v) => set('rowSelection', v)}
          />
          {toggle({ k: 'checkboxSelection', label: 'Checkbox column', disabled: settings.rowSelection === 'none' })}
          {toggle({ k: 'selectOnRowClick', label: 'Select on row click', disabled: settings.rowSelection === 'none' })}
          {toggle({ k: 'enableRangeSelection', label: 'Cell range selection', hint: 'Drag or Shift+Arrows, Ctrl+C to copy' })}
        </Section>
        <Separator />

        <Section title="Features">
          {toggle({ k: 'enableSorting', label: 'Sorting' })}
          {toggle({ k: 'enableMultiSort', label: 'Multi-column sort', hint: 'Shift+click headers', disabled: !settings.enableSorting })}
          {toggle({ k: 'enableFilters', label: 'Column filters' })}
          {toggle({ k: 'enableGlobalSearch', label: 'Global search' })}
          {toggle({ k: 'enableEditing', label: 'Inline editing', hint: 'Enter / double-click to edit' })}
          {toggle({ k: 'enableGrouping', label: 'Row grouping' })}
          {toggle({ k: 'enableExport', label: 'CSV export' })}
        </Section>
        <Separator />

        <Section title="Columns">
          {toggle({ k: 'enableColumnResizing', label: 'Resizing' })}
          {toggle({ k: 'enableColumnReordering', label: 'Drag to reorder' })}
          {toggle({ k: 'enableColumnPinning', label: 'Pinning menu' })}
          {toggle({ k: 'enableColumnPicker', label: 'Column picker' })}
        </Section>
        <Separator />

        <Section title="Event log">
          {eventLog.length === 0 ? (
            <p className="px-1 text-body-small text-on-surface-variant">Interact with the grid to see events.</p>
          ) : (
            <ol className="space-y-1 px-1 font-mono text-body-small text-on-surface-variant" aria-live="polite">
              {eventLog.map((e, i) => (
                <li key={i} className="truncate" title={e}>
                  {e}
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Button variant="outline" className="mt-2 self-start" onClick={() => onChange(DEFAULT_SETTINGS)}>
          <RotateCcw /> Reset to defaults
        </Button>
      </SheetContent>
    </Sheet>
  )
}
