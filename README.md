# DataGrid — React + TypeScript

An AG Grid–style data grid built on **[TanStack Table](https://tanstack.com/table)** (headless engine) and **[TanStack Virtual](https://tanstack.com/virtual)** (row virtualization). It uses **Tailwind CSS** + **shadcn/ui** components themed with **Material Design 3** tokens (color roles, type scale, elevation, state layers).

`DataGrid` is a self-contained, library-style component in [`src/components/data-grid/`](src/components/data-grid). The demo app ([`src/App.tsx`](src/App.tsx), [`src/pages/`](src/pages)) shows it with 50,000 generated employee records (up to 150,000).

## Getting started

Requires Node.js 18+ (tested with Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc -b) + production build into dist/
npm run preview    # serve the production build
npm run lint       # ESLint
```

## Features

| Area | What's included |
| --- | --- |
| Columns | Typed `columnDefs`: `field`, `headerName`, `width`/`minWidth`/`maxWidth`, `sortable`, `filterable`, `editable`, `pinned`, `hide`, `valueGetter`, `valueFormatter`, `cellRenderer`, `comparator`, `aggFunc` |
| Sorting | Click a header to sort. Shift+click adds more columns (numbered indicators). Header menu has asc/desc/clear |
| Filtering | Text, number, date and set filters, opened from the header funnel or the toolbar's **Filter** button. Active filters show as removable chips. Global search box (debounced) |
| Scale | Rows are virtualized, so only the visible rows are in the DOM (~30 rows, even at 150k). Pagination is optional, with a page-size picker |
| Column layout | Pin left/right (sticky, with shadows), drag the resize handle (double-click resets), drag headers to reorder (works across pinned regions), show/hide from the column picker, reset layout |
| Selection | `none` / `single` / `multiple` modes. Checkbox column with select-all (selects every filtered row). Ctrl/⌘+click and Shift+click on rows. M3 hover and selected state layers |
| Editing | Text, number, select and date editors. Start with Enter, F2, double-click or typing. Enter commits and moves down, Tab commits and moves right, Escape cancels. Edited cells get a corner marker and a tooltip with the old value. **Revert** undoes all edits |
| Renderers | `cellRenderers.badge` (status chips), `.progress`, `.link`, `.avatar`. `formatters.currency`, `.number`, `.percent`, `.date`, `.dateTime` |
| Export / clipboard | CSV export of all filtered rows or only selected rows (respects sort and visible columns). Select a cell range by mouse drag, Shift+click, Shift+Arrows or Ctrl+A, then copy it as TSV with Ctrl+C |
| Grouping | Group by one or more columns (toolbar or header menu). Group rows can be expanded/collapsed and show `sum` / `avg` / `count` / `min` / `max` aggregates. Expand all / collapse all |
| Status bar | Row, filtered and selected counts. For a numeric cell range: count, sum, avg, min, max |
| States | Loading skeleton, empty state (with "clear filters" when filtered), error state with retry |
| Accessibility | ARIA `grid` / `row` / `columnheader` / `gridcell` roles with `aria-rowcount`/`colcount`, `aria-rowindex`/`colindex`, `aria-sort`, `aria-selected`, `aria-expanded` and `aria-activedescendant` for the active cell. Live region for announcements. All header controls are reachable by keyboard |
| Theming | Light/dark toggle (stored in `localStorage`, defaults to the system preference). Every color comes from M3 CSS variables in [`src/index.css`](src/index.css) |
| Responsive | Toolbar wraps and collapses button labels. Horizontal scroll with a sticky header. Below 640px container width only the checkbox column stays pinned (`responsiveBreakpoint`) |

### Keyboard shortcuts (grid focused)

| Keys | Action |
| --- | --- |
| Arrow keys | Move the active cell (Ctrl/⌘ jumps to the edge) |
| Shift + Arrow keys | Extend the cell range |
| Tab / Shift+Tab | Next / previous cell, wrapping to the next or previous row; Tab leaves the grid at the end |
| Home / End, Ctrl+Home / Ctrl+End | First / last column; first / last cell |
| PageUp / PageDown | Move up / down one viewport |
| Enter / F2 / typing | Start editing (on a group row, Enter expands or collapses it) |
| Escape | Cancel the edit, or collapse the range |
| Space | Toggle row selection |
| Ctrl/⌘+C | Copy the range as TSV |
| Ctrl/⌘+A | Select all cells |

## Usage

```tsx
import { useRef } from 'react'
import { DataGrid, cellRenderers, formatters, type ColumnDef, type DataGridApi } from '@/components/data-grid'

interface Trade {
  id: number
  symbol: string
  side: 'Buy' | 'Sell'
  qty: number
  price: number
  tradedAt: Date
}

const columns: ColumnDef<Trade>[] = [
  { field: 'symbol', pinned: 'left', width: 120, filter: 'set' },
  {
    field: 'side',
    editable: true,
    cellEditorOptions: ['Buy', 'Sell'],
    cellRenderer: cellRenderers.badge({ tones: { Buy: 'success', Sell: 'destructive' } }),
  },
  { field: 'qty', editable: true, aggFunc: 'sum' },
  { field: 'price', valueFormatter: formatters.currency({ currency: 'USD' }), aggFunc: 'avg' },
  { field: 'tradedAt', headerName: 'Traded', valueFormatter: formatters.dateTime() },
]

export function Trades({ rows }: { rows: Trade[] }) {
  const api = useRef<DataGridApi<Trade>>(null)
  return (
    <DataGrid<Trade>
      rowData={rows}
      columnDefs={columns}
      getRowId={(r) => String(r.id)}
      height={560}
      rowSelection="multiple"
      pagination
      pageSize={50}
      apiRef={api}
      onCellValueChanged={(e) => save(e.rowId, e.field, e.newValue)}
      onSelectionChanged={(selected) => console.log(selected.length)}
    />
  )
}
```

### Main types (`src/components/data-grid/types.ts`)

- **`ColumnDef<TData, TValue>`**: per-column configuration (see the table above). If you leave out `dataType`, it is inferred from the first row, and it sets the default filter, editor, alignment and sort.
- **`DataGridProps<TData>`** = `DataGridOptions` + `DataGridEvents` + `rowData`, `columnDefs`, `getRowId`, `loading`, `error`, `apiRef`.
- **`DataGridOptions`**: `height`, `density` (`compact` | `standard` | `comfortable`), `rowHeight`, `pagination`, `pageSize`, `pageSizeOptions`, `rowSelection`, `checkboxSelection`, `selectOnRowClick`, `enableSorting`, `enableMultiSort`, `enableFilters`, `enableGlobalSearch`, `enableColumnResizing`, `enableColumnReordering`, `enableColumnPinning`, `enableColumnPicker`, `enableEditing`, `enableRangeSelection`, `enableGrouping`, `enableExport`, `enableStatusBar`, `showToolbar`, `striped`, `overscan`, `exportFileName`, `copyHeadersToClipboard`, `responsiveBreakpoint`, `defaultColDef`, `initialState`, `toolbarStart`, `toolbarEnd`, `emptyMessage`, `getRowClassName`.
- **`DataGridEvents`**: `onCellValueChanged`, `onSelectionChanged`, `onSortChanged`, `onFilterChanged`, `onGroupingChanged`, `onColumnStateChanged`, `onRowClicked`, `onRowDoubleClicked`, `onCopy`, `onRetry`.
- **`DataGridApi`** (via `apiRef`): `exportCsv`, `getCsv`, `copySelectionToClipboard`, `getSelectedRows`, `selectAll`, `deselectAll`, `getFilterModel`, `setFilterModel`, `clearFilters`, `setSortModel`, `setGroupBy`, `resetEdits`, `getDirtyCellCount`, `getDisplayedRowCount`, `scrollToRow`, `getColumnState`.
- Filter value types: `TextFilterValue`, `NumberFilterValue`, `DateFilterValue`, `SetFilterValue` (`FilterModel` is keyed by column id).

Editing is uncontrolled: the grid keeps its own copy of `rowData` and reports each change through `onCellValueChanged`. Passing a new `rowData` array resets the grid's copy and clears the edit markers.

## Project structure

```
src/
├── components/
│   ├── data-grid/          # reusable DataGrid library
│   │   ├── DataGrid.tsx    # table instance, virtualization, keyboard, range, editing
│   │   ├── HeaderCell.tsx  # sort / filter / menu / drag / resize
│   │   ├── GridToolbar.tsx # search, filters, grouping, column picker, export, chips
│   │   ├── GridFooter.tsx  # status bar + pagination
│   │   ├── ColumnFilter.tsx, CellEditor.tsx, GridStates.tsx
│   │   ├── columns.ts, filters.ts, formatters.ts, renderers.tsx, utils.ts
│   │   ├── types.ts        # public types
│   │   ├── data-grid.css   # structural styles (sticky, state layers, range, dirty markers)
│   │   └── index.ts        # public exports
│   └── ui/                 # shadcn/ui components (M3-styled)
├── data/                   # faker mock data, generated in a Web Worker
├── hooks/use-theme.ts
├── pages/DemoPage.tsx      # demo page + settings panel (pages/demo/*)
└── App.tsx
```

## Notes

- Mock data is generated in a Web Worker with a fixed faker seed, so the main thread stays responsive and the rows are the same on every load.
- Measured in a production build (headless Chrome on the dev VM), with 250,000 rows: about 1 s from data arriving to first paint, about 1 s per global search or sort, and about 30 DOM rows at any scroll position.
- Memory, not rendering, is the practical row limit. TanStack Table v8 attaches its feature methods to every row object, and the demo rows are fairly wide, so JS heap use is several KB per row. 250k rows used about 2 GB in dev mode, and switching between large datasets crashed a Chrome tab, so the demo stops at 150k. The demo also releases the previous dataset before generating a new one.
- shadcn/ui components live in `src/components/ui` and are registered in `components.json`, so `npx shadcn@latest add <component>` works for adding more.
