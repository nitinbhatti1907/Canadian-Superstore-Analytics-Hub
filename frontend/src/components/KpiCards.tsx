import type { Summary } from '../types'

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  })
}

function trimZeros(value: string) {
  return value.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')
}

function compactNumber(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (abs >= 1_000_000_000) {
    return `${sign}${trimZeros((abs / 1_000_000_000).toFixed(2))}B`
  }

  if (abs >= 1_000_000) {
    return `${sign}${trimZeros((abs / 1_000_000).toFixed(abs < 10_000_000 ? 2 : 1))}M`
  }

  if (abs >= 1_000) {
    return `${sign}${trimZeros((abs / 1_000).toFixed(abs < 10_000 ? 1 : 0))}K`
  }

  return `${n}`
}

function compactMoney(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (abs >= 1_000_000_000) {
    return `${sign}CA$${trimZeros((abs / 1_000_000_000).toFixed(2))}B`
  }

  if (abs >= 1_000_000) {
    return `${sign}CA$${trimZeros((abs / 1_000_000).toFixed(abs < 10_000_000 ? 2 : 1))}M`
  }

  if (abs >= 1_000) {
    return `${sign}CA$${trimZeros((abs / 1_000).toFixed(abs < 100_000 ? 1 : 0))}K`
  }

  return money(n)
}

export default function KpiCards({ summary }: { summary: Summary | null }) {
  const avgOrderValue = summary ? summary.total_sales / Math.max(summary.orders, 1) : 0
  const salesPerCustomer = summary ? summary.total_sales / Math.max(summary.customers, 1) : 0

  const cards = [
    {
      label: 'Total Sales',
      value: summary ? compactMoney(summary.total_sales) : '—',
      helper: summary ? `${compactNumber(summary.rows)} rows in filtered dataset` : 'Waiting for data',
      badge: 'Revenue',
      accent: 'from-cyan-400/30 via-cyan-400/8 to-transparent',
      glow: 'bg-cyan-400/12',
      badgeClass: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100'
    },
    {
      label: 'Total Profit',
      value: summary ? compactMoney(summary.total_profit) : '—',
      helper: summary ? `Margin ${(summary.profit_margin * 100).toFixed(2)}%` : 'Waiting for data',
      badge: 'Profit',
      accent: 'from-emerald-400/30 via-emerald-400/8 to-transparent',
      glow: 'bg-emerald-400/12',
      badgeClass: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
    },
    {
      label: 'Orders',
      value: summary ? compactNumber(summary.orders) : '—',
      helper: summary ? `Avg order value ${compactMoney(avgOrderValue)}` : 'Waiting for data',
      badge: 'Orders',
      accent: 'from-violet-400/30 via-violet-400/8 to-transparent',
      glow: 'bg-violet-400/12',
      badgeClass: 'border-violet-400/25 bg-violet-400/10 text-violet-100'
    },
    {
      label: 'Customers',
      value: summary ? compactNumber(summary.customers) : '—',
      helper: summary ? `Sales per customer ${compactMoney(salesPerCustomer)}` : 'Waiting for data',
      badge: 'Customers',
      accent: 'from-amber-400/30 via-amber-400/8 to-transparent',
      glow: 'bg-amber-400/12',
      badgeClass: 'border-amber-400/25 bg-amber-400/10 text-amber-100'
    },
    {
      label: 'Profit Margin',
      value: summary ? `${(summary.profit_margin * 100).toFixed(2)}%` : '—',
      helper: 'Useful for sales vs profitability trade-off',
      badge: 'Margin',
      accent: 'from-pink-400/30 via-pink-400/8 to-transparent',
      glow: 'bg-pink-400/12',
      badgeClass: 'border-pink-400/25 bg-pink-400/10 text-pink-100'
    },
    {
      label: 'Avg Discount',
      value: summary ? `${(summary.avg_discount * 100).toFixed(2)}%` : '—',
      helper: 'Track discount behavior under applied filters',
      badge: 'Discount',
      accent: 'from-sky-400/30 via-sky-400/8 to-transparent',
      glow: 'bg-sky-400/12',
      badgeClass: 'border-sky-400/25 bg-sky-400/10 text-sky-100'
    }
  ]

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Performance snapshot</div>
          <h3 className="mt-1 text-xl font-semibold text-white">Core business KPIs</h3>
          <p className="mt-1 text-sm text-slate-400">
            Six unique cards only, shared across all dashboard pages.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/85 p-5 shadow-soft backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/15"
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${card.accent}`} />
            <div className={`absolute -right-10 top-0 h-28 w-28 rounded-full blur-3xl ${card.glow}`} />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-400">{card.label}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {card.value}
                  </h3>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${card.badgeClass}`}
                >
                  {card.badge}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                <p className="text-sm leading-6 text-slate-300">{card.helper}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}