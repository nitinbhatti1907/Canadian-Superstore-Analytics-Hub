import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref
} from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

import type { DiscountImpact, NamedMetric, RfmSegment, TimePoint } from '../types'

const COLORS = ['#22d3ee', '#10b981', '#a78bfa', '#f59e0b', '#f472b6', '#60a5fa', '#fb7185', '#34d399']
const GRID = 'rgba(148, 163, 184, 0.14)'
const AXIS = { fill: '#94a3b8', fontSize: 12 }

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  })
}

function compact(n: number) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(n)
}

function shortLabel(label: string, limit = 18) {
  if (label.length <= limit) return label
  return `${label.slice(0, limit)}...`
}

function cleanText(value: unknown) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const normalized = text.toLowerCase()
  if (['nan', 'null', 'undefined', 'n/a', 'na'].includes(normalized)) return ''
  return text
}

function cleanNamedMetricData(data: NamedMetric[]) {
  return data.filter((item) => cleanText(item.name) && Number.isFinite(Number(item.sales)) && Number(item.sales) > 0)
}

function cleanRfmData(data: RfmSegment[]) {
  return data.filter(
    (item) => cleanText(item.segment) && Number.isFinite(Number(item.customers)) && Number(item.customers) > 0
  )
}

function cleanTimeSeries(data: TimePoint[]) {
  return data.filter((item) => cleanText(item.date))
}

function tooltipStyle() {
  return {
    background: 'rgba(2, 6, 23, 0.96)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    borderRadius: '14px',
    color: '#e2e8f0',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.45)'
  }
}

const tooltipItemStyle = { color: '#e2e8f0', fontSize: 13 }
const tooltipLabelStyle = { color: '#cbd5e1', fontWeight: 600 }

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setSize({
        width: rect.width,
        height: rect.height
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => updateSize())
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return { ref, width: size.width, height: size.height }
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
  containerRef,
  compactHeader = false
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  containerRef?: Ref<HTMLDivElement>
  compactHeader?: boolean
}) {
  return (
    <div
      ref={containerRef}
      className={cx(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/65 shadow-soft backdrop-blur',
        compactHeader ? 'p-3.5' : 'p-4',
        className
      )}
    >
      <div className={cx('shrink-0', compactHeader ? 'mb-2.5' : 'mb-3')}>
        <h3 className={cx('font-semibold text-white', compactHeader ? 'text-sm' : 'text-base')}>{title}</h3>
        {subtitle && (
          <p className={cx('mt-1 text-slate-400', compactHeader ? 'text-[11px]' : 'text-sm')}>{subtitle}</p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

function ChartFrame({
  children,
  minHeight = 250,
  className
}: {
  children: ReactNode
  minHeight?: number
  className?: string
}) {
  return (
    <div className={cx('relative min-h-0 flex-1', className)} style={{ minHeight }}>
      {children}
    </div>
  )
}

export function SalesTrend({ data }: { data: TimePoint[] }) {
  const chartData = cleanTimeSeries(data)

  return (
    <ChartCard
      title="Sales and Profit Trend"
      subtitle="Area chart showing how sales and profit change over time."
    >
      <ChartFrame minHeight={250}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke={GRID} />
            <XAxis dataKey="date" tick={AXIS} minTickGap={18} />
            <YAxis tick={AXIS} tickFormatter={(v) => compact(Number(v))} />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number, name: string) => [money(Number(v)), name === 'sales' ? 'Sales' : 'Profit']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="sales" stroke="#22d3ee" fill="url(#salesGradient)" strokeWidth={3} />
            <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFrame>
    </ChartCard>
  )
}

export function DemandTrendChart({ data }: { data: TimePoint[] }) {
  const chartData = cleanTimeSeries(data)

  return (
    <ChartCard
      title="Demand Trend"
      subtitle="Quantity trend helps explain whether sales changes are driven by volume."
    >
      <ChartFrame minHeight={260}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} />
            <XAxis dataKey="date" tick={AXIS} minTickGap={18} />
            <YAxis tick={AXIS} tickFormatter={(v) => compact(Number(v))} />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number) => [Number(v).toLocaleString(), 'Quantity']}
            />
            <Line type="monotone" dataKey="quantity" stroke="#a78bfa" strokeWidth={3.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </ChartCard>
  )
}

export function CategoryDonutChart({
  data,
  title = 'Sales Mix by Category'
}: {
  data: NamedMetric[]
  title?: string
}) {
  const chartData = cleanNamedMetricData(data).slice(0, 6)
  const total = chartData.reduce((sum, item) => sum + item.sales, 0)

  const { ref, width, height } = useElementSize<HTMLDivElement>()

  const compactMode = width > 0 && width < 900
  const denseMode = width > 0 && width < 720
  const tinyMode = width > 0 && width < 560
  const microMode = width > 0 && width < 440
  const shortMode = height > 0 && height < 440

  const chartHeight = microMode ? 110 : tinyMode ? 135 : denseMode || shortMode ? 165 : compactMode ? 205 : 240
  const innerRadius = microMode ? '39%' : tinyMode ? '43%' : denseMode ? '47%' : compactMode ? '51%' : '55%'
  const outerRadius = microMode ? '60%' : tinyMode ? '66%' : denseMode ? '72%' : compactMode ? '77%' : '82%'
  const showValueLine = !denseMode
  const itemPadding = microMode ? 'px-2.5 py-2' : tinyMode ? 'px-3 py-2' : denseMode ? 'px-3.5 py-2.5' : 'px-4 py-3'
  const titleClass = microMode ? 'text-[11px] font-semibold' : tinyMode ? 'text-xs font-semibold' : 'text-sm font-semibold'
  const shareClass = microMode ? 'text-[11px] font-semibold' : tinyMode ? 'text-xs font-semibold' : 'text-sm font-semibold'
  const valueClass = microMode ? 'text-[10px]' : tinyMode ? 'text-[11px]' : 'text-xs'

  return (
    <ChartCard
      containerRef={ref}
      compactHeader={denseMode}
      title={title}
      subtitle="Donut chart for category sales distribution."
    >
      <div className="shrink-0" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number) => [money(Number(v)), 'Sales']}
            />
            <Pie
              data={chartData}
              dataKey="sales"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              stroke="rgba(2, 6, 23, 0.75)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={cx('mt-3 shrink-0', microMode || tinyMode ? 'space-y-2' : 'space-y-3')}>
        {chartData.map((item, index) => {
          const share = total ? (item.sales / total) * 100 : 0

          return (
            <div
              key={`${item.name}-${index}`}
              className={cx('rounded-2xl border border-white/10 bg-white/[0.04]', itemPadding)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cx('shrink-0 rounded-full', microMode ? 'h-2 w-2' : tinyMode ? 'h-2.5 w-2.5' : 'h-3 w-3')}
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-100',
                        titleClass
                      )}
                    >
                      {cleanText(item.name)}
                    </span>

                    <span className={cx('shrink-0 text-slate-300', shareClass)}>{share.toFixed(1)}%</span>
                  </div>

                  {showValueLine && (
                    <div className={cx('mt-1 text-slate-400', valueClass)}>{money(item.sales)}</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

export function RegionPerformanceChart({
  data,
  title = 'Regional Performance'
}: {
  data: NamedMetric[]
  title?: string
}) {
  const chartData = cleanNamedMetricData(data)

  return (
    <ChartCard title={title} subtitle="Horizontal bars make region comparison easier to scan.">
      <ChartFrame minHeight={250}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} />
            <XAxis type="number" tick={AXIS} tickFormatter={(v) => compact(Number(v))} />
            <YAxis
              dataKey="name"
              type="category"
              width={95}
              tick={AXIS}
              tickFormatter={(v: string) => shortLabel(v, 14)}
            />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number, name: string) => [money(Number(v)), name === 'sales' ? 'Sales' : 'Profit']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="sales" fill="#22d3ee" radius={[0, 8, 8, 0]} />
            <Bar dataKey="profit" fill="#10b981" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </ChartCard>
  )
}

export function TopProductsChart({
  data,
  title = 'Top Products by Sales'
}: {
  data: NamedMetric[]
  title?: string
}) {
  const top = cleanNamedMetricData(data).slice(0, 8).map((item) => ({
    ...item,
    shortName: shortLabel(item.name, 18)
  }))

  return (
    <ChartCard title={title} subtitle="Compare top product revenue and profit together.">
      <ChartFrame minHeight={250}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} margin={{ top: 10, right: 10, left: 0, bottom: 34 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} />
            <XAxis dataKey="shortName" tick={AXIS} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={AXIS} tickFormatter={(v) => compact(Number(v))} />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number, name: string) => [money(Number(v)), name === 'sales' ? 'Sales' : 'Profit']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="sales" fill="#60a5fa" radius={[10, 10, 0, 0]} />
            <Bar dataKey="profit" fill="#f59e0b" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </ChartCard>
  )
}

export function DiscountImpactChart({ data }: { data: DiscountImpact[] }) {
  const chartData = data
    .filter(
      (item) =>
        cleanText(item.discount_range) &&
        Number.isFinite(Number(item.sales)) &&
        Number.isFinite(Number(item.profit)) &&
        Number.isFinite(Number(item.avg_margin))
    )
    .map((item) => ({
      ...item,
      avg_margin_pct: Number((item.avg_margin * 100).toFixed(2))
    }))

  return (
    <ChartCard
      title="Discount Impact Analysis"
      subtitle="Combo chart showing sales, profit, and average margin together."
    >
      <ChartFrame minHeight={250}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} />
            <XAxis
              dataKey="discount_range"
              tick={AXIS}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={56}
            />
            <YAxis yAxisId="left" tick={AXIS} tickFormatter={(v) => compact(Number(v))} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={AXIS}
              tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number, name: string) => {
                if (name === 'avg_margin_pct') return [`${Number(v).toFixed(2)}%`, 'Avg Margin']
                return [money(Number(v)), name === 'sales' ? 'Sales' : 'Profit']
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="sales" fill="#22d3ee" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="left" dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avg_margin_pct"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartFrame>

      <p className="mt-3 shrink-0 text-sm text-slate-400">
        Higher discount levels may increase sales, but profit margin needs close monitoring.
      </p>
    </ChartCard>
  )
}

export function RfmSegmentsChart({ data }: { data: RfmSegment[] }) {
  const chartData = cleanRfmData(data)

  const topByCustomers =
    chartData.length > 0
      ? [...chartData].sort((a, b) => b.customers - a.customers)[0]
      : null

  const topBySales =
    chartData.length > 0
      ? [...chartData].sort((a, b) => b.sales - a.sales)[0]
      : null

  return (
    <ChartCard
      title="Customer Segmentation"
      subtitle="RFM-style segment view with customers and sales on separate axes."
    >
      <ChartFrame minHeight={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 16 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={GRID} />
            <XAxis dataKey="segment" tick={AXIS} interval={0} angle={0} textAnchor="middle" height={34} />
            <YAxis yAxisId="left" tick={AXIS} />
            <YAxis yAxisId="right" orientation="right" tick={AXIS} tickFormatter={(v) => compact(Number(v))} />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number, name: string) => {
                if (name === 'sales') return [money(Number(v)), 'Sales']
                if (name === 'profit') return [money(Number(v)), 'Profit']
                return [Number(v).toLocaleString(), 'Customers']
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="customers" fill="#a78bfa" radius={[10, 10, 0, 0]} />
            <Bar yAxisId="right" dataKey="sales" fill="#22d3ee" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <div className="mt-3 shrink-0 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Largest segment</div>
          <div className="mt-2 text-sm font-semibold text-white">{topByCustomers?.segment ?? '—'}</div>
          <div className="mt-1 text-xs text-slate-400">
            {topByCustomers ? `${topByCustomers.customers.toLocaleString()} customers` : 'No segment data'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Top sales segment</div>
          <div className="mt-2 text-sm font-semibold text-white">{topBySales?.segment ?? '—'}</div>
          <div className="mt-1 text-xs text-slate-400">
            {topBySales ? money(topBySales.sales) : 'No sales data'}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}

export function RfmDonutChart({ data }: { data: RfmSegment[] }) {
  const chartData = cleanRfmData(data)
  const totalCustomers = chartData.reduce((sum, item) => sum + item.customers, 0)

  const { ref, width, height } = useElementSize<HTMLDivElement>()

  const compactMode = width > 0 && width < 900
  const denseMode = width > 0 && width < 720
  const tinyMode = width > 0 && width < 560
  const microMode = width > 0 && width < 440
  const shortMode = height > 0 && height < 440

  const chartHeight = microMode ? 105 : tinyMode ? 130 : denseMode || shortMode ? 160 : compactMode ? 200 : 235
  const innerRadius = microMode ? '39%' : tinyMode ? '43%' : denseMode ? '47%' : compactMode ? '51%' : '55%'
  const outerRadius = microMode ? '60%' : tinyMode ? '66%' : denseMode ? '72%' : compactMode ? '77%' : '82%'
  const itemPadding = microMode ? 'px-2.5 py-2' : tinyMode ? 'px-3 py-2' : denseMode ? 'px-3.5 py-2.5' : 'px-4 py-3'
  const labelClass = microMode ? 'text-[11px] font-medium' : tinyMode ? 'text-xs font-medium' : 'text-sm font-medium'
  const shareClass = microMode ? 'text-[11px] font-semibold' : tinyMode ? 'text-xs font-semibold' : 'text-sm font-semibold'

  return (
    <ChartCard
      containerRef={ref}
      compactHeader={denseMode}
      title="Customer Mix by Segment"
      subtitle="Donut distribution of the customer base across segments."
    >
      <div className="shrink-0" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number) => [Number(v).toLocaleString(), 'Customers']}
            />
            <Pie
              data={chartData}
              dataKey="customers"
              nameKey="segment"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              stroke="rgba(2, 6, 23, 0.75)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`${entry.segment}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={cx('mt-3 shrink-0', microMode || tinyMode ? 'space-y-2' : 'space-y-3')}>
        {chartData.map((item, index) => {
          const share = totalCustomers ? (item.customers / totalCustomers) * 100 : 0

          return (
            <div
              key={`${item.segment}-${index}`}
              className={cx('rounded-2xl border border-white/10 bg-white/[0.04]', itemPadding)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cx('shrink-0 rounded-full', microMode ? 'h-2 w-2' : tinyMode ? 'h-2.5 w-2.5' : 'h-3 w-3')}
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cx(
                        'min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-slate-200',
                        labelClass
                      )}
                    >
                      {cleanText(item.segment)}
                    </span>

                    <span className={cx('shrink-0 text-slate-300', shareClass)}>{share.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

export function CategoryRadarChart({
  data,
  title = 'Category Sales Footprint'
}: {
  data: NamedMetric[]
  title?: string
}) {
  const chartData = cleanNamedMetricData(data).slice(0, 6).map((item) => ({
    name: shortLabel(item.name, 14),
    sales: Number(item.sales.toFixed(2))
  }))

  return (
    <ChartCard title={title} subtitle="Radar chart for quick visual category comparison.">
      <ChartFrame minHeight={250}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius="72%" data={chartData}>
            <PolarGrid stroke={GRID} />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => compact(Number(v))} />
            <Radar
              name="Sales"
              dataKey="sales"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.38}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={tooltipStyle()}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(v: number) => [money(Number(v)), 'Sales']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </ChartCard>
  )
}