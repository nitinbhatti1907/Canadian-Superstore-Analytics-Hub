import type { RowsResponse } from '../types'

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 })
}

function formatHeader(label: string) {
  return label
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getColumnClass(column: string) {
  const key = column.toLowerCase().replace(/\s+/g, '_')

  if (
    key.includes('date') ||
    key.endsWith('id') ||
    key.includes('ship_mode') ||
    key.includes('order_priority') ||
    key.includes('postal') ||
    key.includes('country')
  ) {
    return 'whitespace-nowrap'
  }

  if (
    key === 'sales' ||
    key === 'profit' ||
    key === 'discount' ||
    key === 'quantity' ||
    key === 'row_id'
  ) {
    return 'whitespace-nowrap text-right tabular-nums'
  }

  return 'min-w-[140px]'
}

export default function DataTable({
  data,
  onPrev,
  onNext,
  canPrev,
  canNext
}: {
  data: RowsResponse | null
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}) {
  const items = data?.items ?? []
  const cols = items.length ? Object.keys(items[0]) : []

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/65 p-5 shadow-soft backdrop-blur">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Rows (sample)</h3>
        <p className="mt-1 text-sm text-slate-400">
          Showing a paginated sample for performance, not all rows at once.
        </p>
      </div>

      <div className="dashboard-scrollbar overflow-auto rounded-2xl border border-white/10 bg-slate-950/35">
        <table className="min-w-[1350px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 backdrop-blur"
                >
                  {formatHeader(c)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {items.map((row, idx) => (
              <tr key={idx} className="odd:bg-white/[0.02] even:bg-white/[0.04] hover:bg-white/[0.06]">
                {cols.map((c) => {
                  const v = row[c]
                  let displayValue: string

                  if (c === 'Sales' || c === 'Profit') {
                    displayValue = typeof v === 'number' ? money(v) : String(v ?? '')
                  } else if (c === 'Discount') {
                    displayValue = typeof v === 'number' ? `${(v * 100).toFixed(0)}%` : String(v ?? '')
                  } else {
                    displayValue = String(v ?? '')
                  }

                  return (
                    <td
                      key={c}
                      className={`border-t border-white/5 px-4 py-3 align-top text-sm leading-6 text-slate-200 ${getColumnClass(
                        c
                      )}`}
                    >
                      <span className="break-words">{displayValue}</span>
                    </td>
                  )
                })}
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={50} className="px-4 py-8 text-center text-sm text-slate-400">
                  No rows for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          Total rows: <span className="font-semibold text-white">{data ? data.total.toLocaleString() : '—'}</span>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onPrev}
            disabled={!canPrev}
          >
            Prev
          </button>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onNext}
            disabled={!canNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}