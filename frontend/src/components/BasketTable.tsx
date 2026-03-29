import type { BasketPair } from '../types'

export default function BasketTable({ data }: { data: BasketPair[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/65 p-5 shadow-soft backdrop-blur">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Market Basket Analysis</h3>
        <p className="mt-1 text-sm text-slate-400">
          These product pairs appear together most often in the same order.
        </p>
      </div>

      <div className="dashboard-scrollbar overflow-auto rounded-2xl border border-white/10 bg-slate-950/35">
        <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
                Rank
              </th>
              <th className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
                Product A
              </th>
              <th className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
                Product B
              </th>
              <th className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300 backdrop-blur">
                Pair Count
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((pair, index) => (
              <tr
                key={`${pair.product_a}-${pair.product_b}-${index}`}
                className="odd:bg-white/[0.03] even:bg-white/[0.05] hover:bg-white/[0.07]"
              >
                <td className="border-t border-white/5 px-4 py-3 text-sm font-semibold whitespace-nowrap text-cyan-300">
                  #{index + 1}
                </td>
                <td className="border-t border-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                  <span className="break-words">{pair.product_a}</span>
                </td>
                <td className="border-t border-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                  <span className="break-words">{pair.product_b}</span>
                </td>
                <td className="border-t border-white/5 px-4 py-3 text-sm font-semibold whitespace-nowrap text-white">
                  {pair.count.toLocaleString()}
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                  No basket pairs found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}