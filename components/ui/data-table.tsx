'use client'

import * as React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { SkeletonTableRow } from '@/components/ui/skeleton'

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  searchPlaceholder?: string
  searchKey?: string
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search…',
  searchKey,
  isLoading = false,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(e.target.value)
    } else {
      setGlobalFilter(e.target.value)
    }
  }

  const searchValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
    : globalFilter

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="w-full max-w-xs">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={handleSearchChange}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500',
                        header.column.getCanSort() &&
                          'cursor-pointer select-none hover:text-slate-700',
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="ml-1 text-slate-300">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-600" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={columns.length} />
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-slate-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row count */}
        {!isLoading && table.getRowModel().rows.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-400">
            Showing {table.getRowModel().rows.length} of {data.length} records
          </div>
        )}
      </div>
    </div>
  )
}
