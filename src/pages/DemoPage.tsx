import { useCallback, useEffect, useMemo, useState } from 'react'
import { Moon, Settings2, Sun, Table2 } from 'lucide-react'

import { DataGrid } from '@/components/data-grid'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Employee } from '@/data/employeeTypes'
import { loadEmployees } from '@/data/loadEmployees'
import { useTheme } from '@/hooks/use-theme'
import { employeeColumns } from './demo/employeeColumns'
import { DEFAULT_SETTINGS, type DemoSettings } from './demo/settings'
import { SettingsPanel } from './demo/SettingsPanel'

const EMPTY: Employee[] = []

export function DemoPage() {
  const { theme, toggle } = useTheme()
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rows, setRows] = useState<Employee[]>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [genMs, setGenMs] = useState<number | null>(null)
  const [eventLog, setEventLog] = useState<string[]>([])

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    const started = performance.now()
    const { promise, cancel } = loadEmployees(settings.rowCount)
    let active = true
    promise
      .then((data) => {
        if (!active) return
        setRows(data)
        setGenMs(Math.round(performance.now() - started))
      })
      .catch((e: Error) => active && setLoadError(e))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
      cancel()
    }
  }, [settings.rowCount, reloadKey])

  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString()
    setEventLog((prev) => [`${time}  ${msg}`, ...prev].slice(0, 8))
  }, [])

  const isLoading = loading || settings.simulate === 'loading'
  const error =
    loadError ?? (settings.simulate === 'error' ? new Error('Simulated network error: the server returned 503.') : null)
  const rowData = settings.simulate === 'empty' ? EMPTY : rows

  const gridOptions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rowCount, simulate, pageSize, ...rest } = settings
    return { ...rest, pageSize }
  }, [settings])

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-outline-variant bg-surface-container px-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary-container text-primary-container-foreground">
          <Table2 className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-title-large text-on-surface">DataGrid</h1>
          <p className="hidden truncate text-body-small text-on-surface-variant sm:block">
            TanStack Table + Virtual · shadcn/ui · Material 3
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={toggle}>
                {theme === 'dark' ? <Sun /> : <Moon />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>
          <Button variant="tonal" onClick={() => setSettingsOpen(true)} aria-haspopup="dialog">
            <Settings2 /> <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-2 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
          <h2 className="text-headline-small text-on-surface">Employee directory</h2>
          <p className="text-body-small text-on-surface-variant" aria-live="polite">
            {isLoading
              ? `Generating ${settings.rowCount.toLocaleString()} records…`
              : `${rowData.length.toLocaleString()} records${genMs != null ? ` · generated in ${genMs.toLocaleString()} ms` : ''}`}
          </p>
        </div>

        <DataGrid<Employee>
          aria-label="Employee directory"
          className="min-h-[420px] flex-1"
          height="100%"
          rowData={rowData}
          columnDefs={employeeColumns}
          getRowId={(row) => String(row.id)}
          loading={isLoading}
          error={error}
          exportFileName="employees.csv"
          {...gridOptions}
          onRetry={() => {
            setSettings((s) => ({ ...s, simulate: 'none' }))
            setReloadKey((k) => k + 1)
          }}
          onCellValueChanged={(e) =>
            log(`cellValueChanged ${e.colId}#${e.rowId}: ${String(e.oldValue)} → ${String(e.newValue)}`)
          }
          onSelectionChanged={(sel) => log(`selectionChanged: ${sel.length.toLocaleString()} rows`)}
          onSortChanged={(s) => log(`sortChanged: ${s.map((x) => `${x.colId} ${x.sort}`).join(', ') || 'none'}`)}
          onFilterChanged={(f) =>
            log(`filterChanged: ${Object.keys(f.filterModel).join(', ') || 'none'}${f.globalFilter ? ` + "${f.globalFilter}"` : ''}`)
          }
          onGroupingChanged={(g) => log(`groupingChanged: ${g.join(' › ') || 'none'}`)}
          onCopy={(c) => log(`copy: ${c.rowCount}×${c.columnCount} cells`)}
        />
      </main>

      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={setSettings}
        eventLog={eventLog}
      />
    </div>
  )
}
