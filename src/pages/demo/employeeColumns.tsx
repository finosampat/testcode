import { cellRenderers, formatters, type ColumnDef } from '@/components/data-grid'
import { DEPARTMENTS, LEVELS, STATUSES, type Employee } from '@/data/employeeTypes'

const currency = formatters.currency({ currency: 'USD', maximumFractionDigits: 0 })
const date = formatters.date({ dateStyle: 'medium' })

export const employeeColumns: ColumnDef<Employee>[] = [
  { field: 'employeeId', headerName: 'ID', width: 130, pinned: 'left', enableRowGroup: false, lockVisible: true },
  {
    field: 'name',
    headerName: 'Employee',
    width: 220,
    pinned: 'left',
    editable: true,
    enableRowGroup: false,
    cellRenderer: cellRenderers.avatar(),
  },
  {
    field: 'email',
    width: 260,
    enableRowGroup: false,
    cellRenderer: cellRenderers.link<Employee>({ href: (row) => `mailto:${row.email}` }),
  },
  {
    field: 'department',
    width: 170,
    filter: 'set',
    editable: true,
    cellEditorOptions: DEPARTMENTS,
  },
  { field: 'title', headerName: 'Job title', width: 230, editable: true, enableRowGroup: false },
  { field: 'level', width: 120, filter: 'set', filterOptions: LEVELS, editable: true, cellEditorOptions: LEVELS },
  { field: 'city', width: 160, enableRowGroup: false },
  { field: 'country', width: 160, filter: 'set' },
  {
    field: 'salary',
    width: 140,
    editable: true,
    valueFormatter: currency,
    aggFunc: 'avg',
    headerTooltip: 'Annual base salary (USD)',
  },
  { field: 'bonus', width: 130, editable: true, valueFormatter: currency, aggFunc: 'sum' },
  {
    field: 'performance',
    width: 170,
    editable: true,
    aggFunc: 'avg',
    valueFormatter: (v) => (v == null ? '' : `${Math.round(Number(v))}%`),
    cellRenderer: cellRenderers.progress({ max: 100 }),
    enableRowGroup: false,
  },
  { field: 'startDate', headerName: 'Start date', width: 150, editable: true, valueFormatter: date, enableRowGroup: false },
  { field: 'lastReview', headerName: 'Last review', width: 150, valueFormatter: date, enableRowGroup: false, hide: true },
  {
    field: 'remote',
    width: 110,
    valueFormatter: (v) => (v ? 'Remote' : 'On-site'),
    align: 'center',
  },
  {
    field: 'profileUrl',
    headerName: 'Profile',
    width: 140,
    sortable: false,
    enableRowGroup: false,
    valueFormatter: () => 'View profile',
    cellRenderer: cellRenderers.link<Employee>({ href: (row) => row.profileUrl, external: true }),
  },
  {
    field: 'status',
    width: 140,
    pinned: 'right',
    filter: 'set',
    filterOptions: STATUSES,
    editable: true,
    cellEditorOptions: STATUSES,
    aggFunc: 'count',
    cellRenderer: cellRenderers.badge({
      tones: { Active: 'success', 'On Leave': 'warning', Probation: 'info', Terminated: 'destructive' },
    }),
  },
]
