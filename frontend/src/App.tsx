import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import FiltersPanel from './components/FiltersPanel'
import KpiCards from './components/KpiCards'
import DataTable from './components/DataTable'
import BasketTable from './components/BasketTable'
import {
  CategoryDonutChart,
  CategoryRadarChart,
  DemandTrendChart,
  DiscountImpactChart,
  RegionPerformanceChart,
  RfmDonutChart,
  RfmSegmentsChart,
  SalesTrend,
  TopProductsChart
} from './components/Charts'
import { apiGet, buildQuery } from './api/client'
import type {
  BasketPair,
  DiscountImpact,
  Filters,
  Meta,
  NamedMetric,
  RfmSegment,
  RowsResponse,
  Summary,
  TimePoint
} from './types'

import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

type PageKey = 'overview' | 'sales' | 'customers' | 'products' | 'explorer'

type GridLayoutItem = {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

type GridLayouts = Record<string, GridLayoutItem[]>
type PageLayoutsState = Record<PageKey, GridLayouts>
type EditModesState = Record<PageKey, boolean>

type WidgetConfig = {
  key: string
  title: string
  node: ReactNode
  minHeight?: number
}

const ResponsiveGridLayout = WidthProvider(Responsive)

const BREAKPOINTS = { lg: 1280, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }
const LAYOUT_STORAGE_KEY = 'superstore-page-layouts-v6'

const NAV_ITEMS: Array<{
  key: PageKey
  label: string
  desc: string
  tag: string
}> = [
    {
      key: 'overview',
      label: 'Overview',
      desc: 'KPI summary and big-picture performance',
      tag: '01'
    },
    {
      key: 'sales',
      label: 'Sales Analytics',
      desc: 'Revenue, profit, discount and trend analysis',
      tag: '02'
    },
    {
      key: 'customers',
      label: 'Customer Insights',
      desc: 'Segmentation and customer value patterns',
      tag: '03'
    },
    {
      key: 'products',
      label: 'Product & Basket',
      desc: 'Top products, category mix and pair analysis',
      tag: '04'
    },
    {
      key: 'explorer',
      label: 'Data Explorer',
      desc: 'Filtered records and report-ready notes',
      tag: '05'
    }
  ]

const DEFAULT_LAYOUTS_BY_PAGE: PageLayoutsState = {
  overview: {
    lg: [
      { i: 'salesTrend', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      { i: 'categoryMix', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'regionPerformance', x: 0, y: 4, w: 7, h: 4, minW: 4, minH: 3 },
      { i: 'demandTrend', x: 7, y: 4, w: 5, h: 4, minW: 4, minH: 3 }
    ],
    md: [
      { i: 'salesTrend', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'categoryMix', x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'regionPerformance', x: 0, y: 8, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'demandTrend', x: 0, y: 12, w: 12, h: 4, minW: 4, minH: 3 }
    ],
    sm: [
      { i: 'salesTrend', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'categoryMix', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'regionPerformance', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'demandTrend', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 3 }
    ],
    xs: [
      { i: 'salesTrend', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'categoryMix', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'regionPerformance', x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'demandTrend', x: 0, y: 12, w: 4, h: 4, minW: 2, minH: 3 }
    ],
    xxs: [
      { i: 'salesTrend', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'categoryMix', x: 0, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'regionPerformance', x: 0, y: 8, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'demandTrend', x: 0, y: 12, w: 2, h: 4, minW: 2, minH: 3 }
    ]
  },

  sales: {
    lg: [
      { i: 'topProducts', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      { i: 'categoryRadar', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'discountImpact', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'regionalContribution', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 }
    ],
    md: [
      { i: 'topProducts', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'categoryRadar', x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'discountImpact', x: 0, y: 8, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'regionalContribution', x: 0, y: 12, w: 12, h: 4, minW: 4, minH: 3 }
    ],
    sm: [
      { i: 'topProducts', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'categoryRadar', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'discountImpact', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'regionalContribution', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 3 }
    ],
    xs: [
      { i: 'topProducts', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'categoryRadar', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'discountImpact', x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'regionalContribution', x: 0, y: 12, w: 4, h: 4, minW: 2, minH: 3 }
    ],
    xxs: [
      { i: 'topProducts', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'categoryRadar', x: 0, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'discountImpact', x: 0, y: 8, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'regionalContribution', x: 0, y: 12, w: 2, h: 4, minW: 2, minH: 3 }
    ]
  },

  customers: {
    lg: [
      { i: 'rfmSegments', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      { i: 'rfmMix', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'storyline', x: 0, y: 4, w: 8, h: 3, minW: 4, minH: 2 },
      { i: 'presentationTip', x: 8, y: 4, w: 4, h: 3, minW: 3, minH: 2 }
    ],
    md: [
      { i: 'rfmSegments', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'rfmMix', x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'storyline', x: 0, y: 8, w: 12, h: 3, minW: 4, minH: 2 },
      { i: 'presentationTip', x: 0, y: 11, w: 12, h: 3, minW: 4, minH: 2 }
    ],
    sm: [
      { i: 'rfmSegments', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'rfmMix', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'storyline', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 2 },
      { i: 'presentationTip', x: 0, y: 12, w: 6, h: 3, minW: 3, minH: 2 }
    ],
    xs: [
      { i: 'rfmSegments', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'rfmMix', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'storyline', x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 2 },
      { i: 'presentationTip', x: 0, y: 12, w: 4, h: 3, minW: 2, minH: 2 }
    ],
    xxs: [
      { i: 'rfmSegments', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'rfmMix', x: 0, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'storyline', x: 0, y: 8, w: 2, h: 4, minW: 2, minH: 2 },
      { i: 'presentationTip', x: 0, y: 12, w: 2, h: 3, minW: 2, minH: 2 }
    ]
  },

  products: {
    lg: [
      { i: 'productPerformance', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      { i: 'categoryShare', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'basket', x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 },
      { i: 'highlights', x: 8, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
      { i: 'quickInsight', x: 8, y: 6, w: 4, h: 2, minW: 3, minH: 2 }
    ],
    md: [
      { i: 'productPerformance', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
      { i: 'categoryShare', x: 0, y: 4, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'basket', x: 0, y: 8, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'highlights', x: 0, y: 12, w: 12, h: 2, minW: 4, minH: 2 },
      { i: 'quickInsight', x: 0, y: 14, w: 12, h: 2, minW: 4, minH: 2 }
    ],
    sm: [
      { i: 'productPerformance', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'categoryShare', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'basket', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'highlights', x: 0, y: 12, w: 6, h: 3, minW: 3, minH: 2 },
      { i: 'quickInsight', x: 0, y: 15, w: 6, h: 3, minW: 3, minH: 2 }
    ],
    xs: [
      { i: 'productPerformance', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'categoryShare', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'basket', x: 0, y: 8, w: 4, h: 4, minW: 2, minH: 3 },
      { i: 'highlights', x: 0, y: 12, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'quickInsight', x: 0, y: 15, w: 4, h: 3, minW: 2, minH: 2 }
    ],
    xxs: [
      { i: 'productPerformance', x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'categoryShare', x: 0, y: 4, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'basket', x: 0, y: 8, w: 2, h: 4, minW: 2, minH: 3 },
      { i: 'highlights', x: 0, y: 12, w: 2, h: 3, minW: 2, minH: 2 },
      { i: 'quickInsight', x: 0, y: 15, w: 2, h: 3, minW: 2, minH: 2 }
    ]
  },

  explorer: {
    lg: [
      { i: 'table', x: 0, y: 0, w: 8, h: 6, minW: 5, minH: 4 },
      { i: 'activeFilters', x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'notes', x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2 }
    ],
    md: [
      { i: 'table', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 4 },
      { i: 'activeFilters', x: 0, y: 6, w: 12, h: 3, minW: 4, minH: 2 },
      { i: 'notes', x: 0, y: 9, w: 12, h: 3, minW: 4, minH: 2 }
    ],
    sm: [
      { i: 'table', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
      { i: 'activeFilters', x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
      { i: 'notes', x: 0, y: 9, w: 6, h: 3, minW: 3, minH: 2 }
    ],
    xs: [
      { i: 'table', x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
      { i: 'activeFilters', x: 0, y: 6, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'notes', x: 0, y: 9, w: 4, h: 3, minW: 2, minH: 2 }
    ],
    xxs: [
      { i: 'table', x: 0, y: 0, w: 2, h: 6, minW: 2, minH: 4 },
      { i: 'activeFilters', x: 0, y: 6, w: 2, h: 3, minW: 2, minH: 2 },
      { i: 'notes', x: 0, y: 9, w: 2, h: 3, minW: 2, minH: 2 }
    ]
  }
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
}

function cloneLayouts(layouts: GridLayouts): GridLayouts {
  return Object.fromEntries(
    Object.entries(layouts).map(([breakpoint, items]) => [
      breakpoint,
      items.map((item) => ({ ...item }))
    ])
  )
}

function cloneLayoutsByPage(layoutsByPage: PageLayoutsState): PageLayoutsState {
  return {
    overview: cloneLayouts(layoutsByPage.overview),
    sales: cloneLayouts(layoutsByPage.sales),
    customers: cloneLayouts(layoutsByPage.customers),
    products: cloneLayouts(layoutsByPage.products),
    explorer: cloneLayouts(layoutsByPage.explorer)
  }
}

function normalizePageLayouts(input: unknown): PageLayoutsState {
  const fallback = cloneLayoutsByPage(DEFAULT_LAYOUTS_BY_PAGE)

  if (!input || typeof input !== 'object') {
    return fallback
  }

  const parsed = input as Record<string, unknown>
  const next = {} as PageLayoutsState

    ; (Object.keys(DEFAULT_LAYOUTS_BY_PAGE) as PageKey[]).forEach((pageKey) => {
      const defaultLayouts = DEFAULT_LAYOUTS_BY_PAGE[pageKey]
      const rawPageLayouts =
        parsed[pageKey] && typeof parsed[pageKey] === 'object'
          ? (parsed[pageKey] as Record<string, unknown>)
          : {}

      const pageLayouts: GridLayouts = {}

      Object.entries(defaultLayouts).forEach(([breakpoint, defaultItems]) => {
        const rawItems = Array.isArray(rawPageLayouts[breakpoint])
          ? (rawPageLayouts[breakpoint] as Array<Record<string, unknown>>)
          : []

        const cleaned = rawItems
          .filter((item) => typeof item?.i === 'string')
          .map((item) => ({
            i: String(item.i),
            x: Number(item.x ?? 0),
            y: Number(item.y ?? 0),
            w: Number(item.w ?? 4),
            h: Number(item.h ?? 4),
            minW: Number(item.minW ?? 2),
            minH: Number(item.minH ?? 2),
            maxW: item.maxW !== undefined ? Number(item.maxW) : undefined,
            maxH: item.maxH !== undefined ? Number(item.maxH) : undefined
          }))

        const ids = new Set(cleaned.map((item) => item.i))
        const missing = defaultItems.filter((item) => !ids.has(item.i)).map((item) => ({ ...item }))

        pageLayouts[breakpoint] = [...cleaned, ...missing]
      })

      next[pageKey] = pageLayouts
    })

  return next
}

function loadLayoutsByPage(): PageLayoutsState {
  if (typeof window === 'undefined') {
    return cloneLayoutsByPage(DEFAULT_LAYOUTS_BY_PAGE)
  }

  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return cloneLayoutsByPage(DEFAULT_LAYOUTS_BY_PAGE)
    return normalizePageLayouts(JSON.parse(raw))
  } catch {
    return cloneLayoutsByPage(DEFAULT_LAYOUTS_BY_PAGE)
  }
}

function saveLayoutsByPage(layoutsByPage: PageLayoutsState) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutsByPage))
  } catch {
    // ignore storage errors
  }
}

function getActiveFilterLabels(filters: Filters) {
  const items: string[] = []

  if (filters.start_date || filters.end_date) {
    items.push(`Date: ${filters.start_date ?? 'Any'} to ${filters.end_date ?? 'Any'}`)
  }

  const map: Array<[keyof Filters, string]> = [
    ['category', 'Category'],
    ['sub_category', 'Sub-category'],
    ['segment', 'Segment'],
    ['region', 'Region'],
    ['state', 'Province/State'],
    ['city', 'City'],
    ['ship_mode', 'Ship Mode'],
    ['order_priority', 'Priority']
  ]

  map.forEach(([key, label]) => {
    const value = filters[key]
    if (Array.isArray(value) && value.length) {
      items.push(`${label}: ${value.join(', ')}`)
    }
  })

  if (filters.min_discount !== undefined) items.push(`Min discount: ${filters.min_discount}`)
  if (filters.max_discount !== undefined) items.push(`Max discount: ${filters.max_discount}`)

  return items
}

function SectionIntro({
  title,
  description,
  actions
}: {
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-4 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{description}</p>
        </div>

        {actions ? <div className="shrink-0 self-start">{actions}</div> : null}
      </div>
    </div>
  )
}

function LayoutEditorToolbar({
  pageLabel,
  editMode,
  onToggleEdit,
  onReset,
  onExportPdf,
  isExporting
}: {
  pageLabel: string
  editMode: boolean
  onToggleEdit: () => void
  onReset: () => void
  onExportPdf: () => void
  isExporting: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onExportPdf}
        disabled={isExporting}
        title={`Export ${pageLabel} as PDF`}
        aria-label={`Export ${pageLabel} as PDF`}
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/55 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting ? 'Exporting...' : 'PDF'}
      </button>

      <button
        type="button"
        onClick={onToggleEdit}
        title={editMode ? `Exit ${pageLabel} layout edit` : `Edit ${pageLabel} layout`}
        aria-label={editMode ? `Exit ${pageLabel} layout edit` : `Edit ${pageLabel} layout`}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${editMode
            ? 'border-cyan-400/35 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-500/10'
            : 'border-white/10 bg-slate-900/55 text-slate-200 hover:bg-white/10'
          }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onReset}
        title={`Reset ${pageLabel} layout`}
        aria-label={`Reset ${pageLabel} layout`}
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/55 px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
      >
        Reset
      </button>
    </div>
  )
}

function WidgetShell({
  title,
  editMode,
  minHeight = 260,
  children
}: {
  title: string
  editMode: boolean
  minHeight?: number
  children: ReactNode
}) {
  return (
    <div className="relative h-full" style={{ minHeight }}>
      {editMode && (
        <div className="widget-drag-handle absolute right-3 top-3 z-20 cursor-move rounded-full border border-cyan-400/25 bg-slate-950/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100 shadow-lg backdrop-blur">
          Drag {title}
        </div>
      )}

      <div className="h-full">{children}</div>
    </div>
  )
}

function InsightCard({
  title,
  children,
  compact = false
}: {
  title: string
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`h-full rounded-3xl border border-white/10 bg-slate-900/55 shadow-soft backdrop-blur ${compact ? 'p-4' : 'p-5'}`}>
      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-white`}>{title}</h3>
      <div className="mt-3 text-sm leading-6 text-slate-400">{children}</div>
    </div>
  )
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('overview')
  const [meta, setMeta] = useState<Meta | null>(null)

  const [draft, setDraft] = useState<Filters>({})
  const [applied, setApplied] = useState<Filters>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [trend, setTrend] = useState<TimePoint[]>([])
  const [cat, setCat] = useState<NamedMetric[]>([])
  const [region, setRegion] = useState<NamedMetric[]>([])
  const [topProducts, setTopProducts] = useState<NamedMetric[]>([])
  const [discountImpact, setDiscountImpact] = useState<DiscountImpact[]>([])
  const [rfm, setRfm] = useState<RfmSegment[]>([])
  const [pairs, setPairs] = useState<BasketPair[]>([])

  const [rows, setRows] = useState<RowsResponse | null>(null)
  const [offset, setOffset] = useState(0)

  const [editModes, setEditModes] = useState<EditModesState>({
    overview: false,
    sales: false,
    customers: false,
    products: false,
    explorer: false
  })

  const [exportingPage, setExportingPage] = useState<PageKey | null>(null)

  const pageExportRefs = useRef<Record<PageKey, HTMLDivElement | null>>({
    overview: null,
    sales: null,
    customers: null,
    products: null,
    explorer: null
  })

  const [layoutsByPage, setLayoutsByPage] = useState<PageLayoutsState>(() => loadLayoutsByPage())

  const queryBase = useMemo(() => buildQuery(applied), [applied])

  useEffect(() => {
    apiGet<Meta>('/api/meta')
      .then((m) => {
        setMeta(m)
        if (m.date_min && m.date_max) {
          const defaults = { start_date: m.date_min, end_date: m.date_max }
          setDraft(defaults)
          setApplied(defaults)
        }
      })
      .catch((e) => setError(e.message))
  }, [])

  async function fetchAll(nextApplied: Filters, nextOffset: number) {
    setLoading(true)
    setError(null)

    try {
      const qb = buildQuery(nextApplied)

      const [s, t, c, r, p, di, rfmRes, pairRes, rr] = await Promise.all([
        apiGet<Summary>(`/api/summary${qb}`),
        apiGet<{ data: TimePoint[] }>(`/api/timeseries${buildQuery(nextApplied, { granularity: 'month' })}`),
        apiGet<{ data: NamedMetric[] }>(`/api/category_breakdown${buildQuery(nextApplied, { level: 'category' })}`),
        apiGet<{ data: NamedMetric[] }>(`/api/region_breakdown${buildQuery(nextApplied, { level: 'region', top_n: 12 })}`),
        apiGet<{ data: NamedMetric[] }>(`/api/top_products${buildQuery(nextApplied, { metric: 'sales', top_n: 10 })}`),
        apiGet<{ data: DiscountImpact[] }>(`/api/discount_impact${buildQuery(nextApplied, { bins: 8 })}`),
        apiGet<{ data: RfmSegment[] }>(`/api/rfm_segments${qb}`),
        apiGet<{ data: BasketPair[] }>(`/api/basket_pairs${buildQuery(nextApplied, { top_n: 15, top_products: 200 })}`),
        apiGet<RowsResponse>(`/api/rows${buildQuery(nextApplied, { limit: 25, offset: nextOffset })}`)
      ])

      setSummary(s)
      setTrend(t.data)
      setCat(c.data)
      setRegion(r.data)
      setTopProducts(p.data)
      setDiscountImpact(di.data)
      setRfm(rfmRes.data)
      setPairs(pairRes.data)
      setRows(rr)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll(applied, offset)
  }, [queryBase, offset])

  function onApply() {
    setOffset(0)
    setApplied(draft)
  }

  function onReset() {
    if (!meta) {
      setDraft({})
      setApplied({})
      return
    }

    const next: Filters = {}
    if (meta.date_min) next.start_date = meta.date_min
    if (meta.date_max) next.end_date = meta.date_max

    setDraft(next)
    setOffset(0)
    setApplied(next)
  }

  function toggleEditMode(pageKey: PageKey) {
    setEditModes((prev) => ({
      ...prev,
      [pageKey]: !prev[pageKey]
    }))
  }

  function handlePageLayoutChange(pageKey: PageKey, nextLayouts: GridLayouts) {
    const next = {
      ...layoutsByPage,
      [pageKey]: nextLayouts
    }
    setLayoutsByPage(next)
    saveLayoutsByPage(next)
  }

  function resetPageLayout(pageKey: PageKey) {
    const next = {
      ...layoutsByPage,
      [pageKey]: cloneLayouts(DEFAULT_LAYOUTS_BY_PAGE[pageKey])
    }
    setLayoutsByPage(next)
    saveLayoutsByPage(next)
  }

  async function exportPageAsPdf(pageKey: PageKey, pageLabel: string) {
    const node = pageExportRefs.current[pageKey]
    if (!node) return

    try {
      setExportingPage(pageKey)

      const canvas = await html2canvas(node, {
        backgroundColor: '#020617',
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imageWidth = pageWidth
      const imageHeight = (canvas.height * imageWidth) / canvas.width

      let heightLeft = imageHeight
      let position = 0

      pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight, undefined, 'FAST')
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imageHeight
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight, undefined, 'FAST')
        heightLeft -= pageHeight
      }

      const fileName = `${pageLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-dashboard.pdf`
      pdf.save(fileName)
    } finally {
      setExportingPage(null)
    }
  }

  const canPrev = !!rows && offset > 0
  const canNext = !!rows && offset + (rows?.limit ?? 0) < (rows?.total ?? 0)

  const activeFilterLabels = getActiveFilterLabels(applied)
  const currentPage = NAV_ITEMS.find((item) => item.key === activePage)

  const topSegment = rfm.length
    ? [...rfm].sort((a, b) => b.customers - a.customers)[0]
    : null

  const pageWidgets = useMemo<Record<PageKey, WidgetConfig[]>>(
    () => ({
      overview: [
        {
          key: 'salesTrend',
          title: 'Sales and Profit Trend',
          node: <SalesTrend data={trend} />,
          minHeight: 300
        },
        {
          key: 'categoryMix',
          title: 'Sales Mix by Category',
          node: <CategoryDonutChart data={cat} title="Sales Mix by Category" />,
          minHeight: 300
        },
        {
          key: 'regionPerformance',
          title: 'Regional Sales vs Profit',
          node: <RegionPerformanceChart data={region} title="Regional Sales vs Profit" />,
          minHeight: 300
        },
        {
          key: 'demandTrend',
          title: 'Demand Trend',
          node: <DemandTrendChart data={trend} />,
          minHeight: 300
        }
      ],

      sales: [
        {
          key: 'topProducts',
          title: 'Top Products by Sales',
          node: <TopProductsChart data={topProducts} title="Top Products by Sales" />,
          minHeight: 300
        },
        {
          key: 'categoryRadar',
          title: 'Category Sales Footprint',
          node: <CategoryRadarChart data={cat} title="Category Sales Footprint" />,
          minHeight: 300
        },
        {
          key: 'discountImpact',
          title: 'Discount Impact Analysis',
          node: <DiscountImpactChart data={discountImpact} />,
          minHeight: 300
        },
        {
          key: 'regionalContribution',
          title: 'Regional Contribution',
          node: <RegionPerformanceChart data={region} title="Regional Contribution" />,
          minHeight: 300
        }
      ],

      customers: [
        {
          key: 'rfmSegments',
          title: 'Customer Segmentation',
          node: <RfmSegmentsChart data={rfm} />,
          minHeight: 320
        },
        {
          key: 'rfmMix',
          title: 'Customer Mix by Segment',
          node: <RfmDonutChart data={rfm} />,
          minHeight: 300
        },
        {
          key: 'storyline',
          title: 'Customer Storyline',
          minHeight: 220,
          node: (
            <InsightCard title="Customer Storyline" compact>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-3.5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Largest Segment</div>
                  <div className="mt-2 text-lg font-semibold text-white">{topSegment?.segment ?? '—'}</div>
                  <p className="mt-2 text-sm text-slate-400">
                    {topSegment ? `${topSegment.customers.toLocaleString()} customers` : 'Waiting for segment data'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/5 p-3.5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Customer Base</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {summary ? summary.customers.toLocaleString() : '—'}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Filtered customer count across the selected view.</p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/5 p-3.5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Revenue per Customer</div>
                  <div className="mt-2 text-lg font-semibold text-white">
                    {summary ? money(summary.total_sales / Math.max(summary.customers, 1)) : '—'}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">Helpful for discussing value density by audience size.</p>
                </div>
              </div>
            </InsightCard>
          )
        },
        {
          key: 'presentationTip',
          title: 'Customer Segment Readout',
          minHeight: 220,
          node: (
            <InsightCard title="Customer Segment Readout" compact>
              <div className="space-y-3">
                <p>
                  Use this section to compare <span className="font-medium text-slate-200">audience size</span> vs
                  <span className="font-medium text-slate-200"> customer value</span>. The largest segment is not always the
                  most commercially important one.
                </p>

                <div className="rounded-2xl border border-white/8 bg-white/5 p-3.5">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">What this page helps answer</div>
                  <ul className="mt-2 space-y-2">
                    <li>Which segment is largest under the current filters.</li>
                    <li>Whether revenue is concentrated in a smaller, higher-value audience.</li>
                    <li>Whether growth should focus more on acquisition, retention, or upsell.</li>
                  </ul>
                </div>
              </div>
            </InsightCard>
          )
        }
      ],

      products: [
        {
          key: 'productPerformance',
          title: 'Product Performance',
          node: <TopProductsChart data={topProducts} title="Product Performance" />,
          minHeight: 300
        },
        {
          key: 'categoryShare',
          title: 'Category Share',
          node: <CategoryDonutChart data={cat} title="Category Share" />,
          minHeight: 300
        },
        {
          key: 'basket',
          title: 'Market Basket Analysis',
          node: <BasketTable data={pairs} />,
          minHeight: 320
        },
        {
          key: 'highlights',
          title: 'Product Takeaways',
          minHeight: 240,
          node: (
            <InsightCard title="Product Takeaways" compact>
              <ul className="space-y-3">
                <li>Compare the top-product chart with category share to see whether revenue is broad or concentrated.</li>
                <li>When a few products dominate both sales and category mix, they are your strongest commercial anchors.</li>
                <li>Use basket pairs as supporting evidence for cross-sell ideas, not as a standalone decision rule.</li>
                <li>Best bundle candidates usually combine strong sales visibility with repeated pair frequency.</li>
              </ul>
            </InsightCard>
          )
        },
        {
          key: 'quickInsight',
          title: 'Basket Opportunity Summary',
          minHeight: 240,
          node: (
            <InsightCard title="Basket Opportunity Summary" compact>
              <div className="space-y-3">
                <p>
                  Basket analysis is most useful for spotting <span className="font-medium text-slate-200">companion products </span>
                  that customers already purchase together. That can support bundle design, recommendation placement, and
                  merchandising decisions.
                </p>

                <p>
                  For reliable business action, validate pair frequency against product sales performance and category strength.
                  A frequent pair is more valuable when at least one item is already a strong seller or belongs to a priority category.
                </p>
              </div>
            </InsightCard>
          )
        }
      ],

      explorer: [
        {
          key: 'table',
          title: 'Data Explorer',
          node: (
            <DataTable
              data={rows}
              onPrev={() => setOffset((o) => Math.max(0, o - (rows?.limit ?? 25)))}
              onNext={() => setOffset((o) => o + (rows?.limit ?? 25))}
              canPrev={canPrev}
              canNext={canNext}
            />
          ),
          minHeight: 430
        },
        {
          key: 'activeFilters',
          title: 'Active Filters',
          minHeight: 220,
          node: (
            <InsightCard title="Active Filters" compact>
              <div className="flex flex-wrap gap-2">
                {activeFilterLabels.length ? (
                  activeFilterLabels.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">No custom filters applied.</span>
                )}
              </div>
            </InsightCard>
          )
        },
        {
          key: 'notes',
          title: 'Report and Validation Notes',
          minHeight: 240,
          node: (
            <InsightCard title="Report and Validation Notes" compact>
              <ul className="space-y-3">
                <li>Use this page to verify that the filtered records support the story shown in charts and KPI cards.</li>
                <li>Before taking screenshots for a report, confirm the active date range, category filters, and total row count.</li>
                <li>Use the explorer to validate unusual results, such as a sudden spike, a high discount range, or an unexpected top product.</li>
              </ul>
            </InsightCard>
          )
        }
      ]
    }),
    [trend, cat, region, topProducts, discountImpact, rfm, summary, pairs, rows, canPrev, canNext, activeFilterLabels, topSegment]
  )

  function renderGridPage(pageKey: PageKey, label: string, widgets: WidgetConfig[]) {
    return (
      <div className="space-y-5">
        <div className={`dashboard-grid ${editModes[pageKey] ? 'dashboard-grid-editing' : ''}`}>
          <ResponsiveGridLayout
            className="layout"
            layouts={layoutsByPage[pageKey]}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={78}
            margin={[18, 18]}
            containerPadding={[0, 0]}
            isDraggable={editModes[pageKey]}
            isResizable={editModes[pageKey]}
            isBounded={true}
            compactType="vertical"
            draggableHandle=".widget-drag-handle"
            resizeHandles={['e', 's', 'se']}
            measureBeforeMount={false}
            onLayoutChange={(_, allLayouts) => handlePageLayoutChange(pageKey, allLayouts as GridLayouts)}
          >
            {widgets.map((widget) => (
              <div key={widget.key}>
                <WidgetShell title={widget.title} editMode={editModes[pageKey]} minHeight={widget.minHeight}>
                  {widget.node}
                </WidgetShell>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      </div>
    )
  }

  function renderOverviewPage() {
    return (
      <div
        ref={(el) => {
          pageExportRefs.current.overview = el
        }}
        className="space-y-5"
      >
        <SectionIntro
          title="Overview Dashboard"
          description="This page is the big-picture view. Start here to understand overall performance, compare category share, and check how sales, profit, and demand move over time."
          actions={
            <LayoutEditorToolbar
              pageLabel="Overview"
              editMode={editModes.overview}
              onToggleEdit={() => toggleEditMode('overview')}
              onReset={() => resetPageLayout('overview')}
              onExportPdf={() => exportPageAsPdf('overview', 'Overview')}
              isExporting={exportingPage === 'overview'}
            />
          }
        />
        {renderGridPage('overview', 'Overview', pageWidgets.overview)}
      </div>
    )
  }

  function renderSalesPage() {
    return (
      <div
        ref={(el) => {
          pageExportRefs.current.sales = el
        }}
        className="space-y-5"
      >
        <SectionIntro
          title="Sales Analytics"
          description="This page focuses on commercial performance. Use it to explain top-selling products, the impact of discounting, and whether category sales are balanced or concentrated."
          actions={
            <LayoutEditorToolbar
              pageLabel="Sales Analytics"
              editMode={editModes.sales}
              onToggleEdit={() => toggleEditMode('sales')}
              onReset={() => resetPageLayout('sales')}
              onExportPdf={() => exportPageAsPdf('sales', 'Sales Analytics')}
              isExporting={exportingPage === 'sales'}
            />
          }
        />
        {renderGridPage('sales', 'Sales Analytics', pageWidgets.sales)}
      </div>
    )
  }

  function renderCustomersPage() {
    return (
      <div
        ref={(el) => {
          pageExportRefs.current.customers = el
        }}
        className="space-y-5"
      >
        <SectionIntro
          title="Customer Insights"
          description="This section is best for discussing customer mix and which segments generate the most value. Use both the bar and donut charts to explain segment size and revenue importance."
          actions={
            <LayoutEditorToolbar
              pageLabel="Customer Insights"
              editMode={editModes.customers}
              onToggleEdit={() => toggleEditMode('customers')}
              onReset={() => resetPageLayout('customers')}
              onExportPdf={() => exportPageAsPdf('customers', 'Customer Insights')}
              isExporting={exportingPage === 'customers'}
            />
          }
        />
        {renderGridPage('customers', 'Customer Insights', pageWidgets.customers)}
      </div>
    )
  }

  function renderProductsPage() {
    return (
      <div
        ref={(el) => {
          pageExportRefs.current.products = el
        }}
        className="space-y-5"
      >
        <SectionIntro
          title="Product and Basket Analysis"
          description="Use this page to identify product winners, understand category contribution, and show which product combinations commonly appear together in the same order."
          actions={
            <LayoutEditorToolbar
              pageLabel="Product and Basket"
              editMode={editModes.products}
              onToggleEdit={() => toggleEditMode('products')}
              onReset={() => resetPageLayout('products')}
              onExportPdf={() => exportPageAsPdf('products', 'Product and Basket')}
              isExporting={exportingPage === 'products'}
            />
          }
        />
        {renderGridPage('products', 'Product and Basket', pageWidgets.products)}
      </div>
    )
  }

  function renderExplorerPage() {
    return (
      <div
        ref={(el) => {
          pageExportRefs.current.explorer = el
        }}
        className="space-y-5"
      >
        <SectionIntro
          title="Data Explorer"
          description="This page is useful when you want to validate records, review filtered data manually, or take report-ready screenshots for your presentation."
          actions={
            <LayoutEditorToolbar
              pageLabel="Data Explorer"
              editMode={editModes.explorer}
              onToggleEdit={() => toggleEditMode('explorer')}
              onReset={() => resetPageLayout('explorer')}
              onExportPdf={() => exportPageAsPdf('explorer', 'Data Explorer')}
              isExporting={exportingPage === 'explorer'}
            />
          }
        />
        {renderGridPage('explorer', 'Data Explorer', pageWidgets.explorer)}
      </div>
    )
  }

  function renderActivePage() {
    switch (activePage) {
      case 'overview':
        return renderOverviewPage()
      case 'sales':
        return renderSalesPage()
      case 'customers':
        return renderCustomersPage()
      case 'products':
        return renderProductsPage()
      case 'explorer':
        return renderExplorerPage()
      default:
        return renderOverviewPage()
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <style>
        {`
          .dashboard-grid .react-grid-item {
            transition: box-shadow 180ms ease, transform 180ms ease;
          }

          .dashboard-grid .react-grid-item.react-grid-placeholder {
            border-radius: 24px;
            background: rgba(34, 211, 238, 0.14);
            border: 1px dashed rgba(34, 211, 238, 0.35);
          }

          .dashboard-grid-editing .react-grid-item {
            z-index: 1;
          }

          .dashboard-grid-editing .react-grid-item.react-draggable-dragging {
            z-index: 30;
          }

          .dashboard-grid .react-resizable-handle::after {
            border-right-color: rgba(34, 211, 238, 0.95);
            border-bottom-color: rgba(34, 211, 238, 0.95);
          }
        `}
      </style>

      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <aside className="dashboard-scrollbar hidden h-screen w-[260px] shrink-0 overflow-y-auto border-r border-white/8 bg-slate-950/60 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:block">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900/70 to-emerald-500/15 p-5 shadow-glass">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">Analytics Hub</div>
            <h1 className="mt-3 text-2xl font-semibold text-white">Canadian Superstore</h1>
          </div>

          <div className="mt-6">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Navigation
            </div>

            <div className="space-y-2.5">
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === activePage
                return (
                  <button
                    key={item.key}
                    onClick={() => setActivePage(item.key)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition ${isActive
                      ? 'border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
                      : 'border-white/8 bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                        {item.tag}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/70 backdrop-blur">
            <div className="px-4 py-3 md:px-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
                    {currentPage?.label}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white md:text-2xl">
                    Canadian Superstore Analytics Hub
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-400">
                    A modern multi-page dashboard for sales, customers, products, and data exploration.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                    {loading ? 'Refreshing data...' : 'Dashboard ready'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.key === activePage
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActivePage(item.key)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${isActive
                        ? 'border-cyan-400/30 bg-cyan-400/12 text-white'
                        : 'border-white/10 bg-white/5 text-slate-300'
                        }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-4 py-5 md:px-5">
            {error && (
              <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100 shadow-soft">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}

            <FiltersPanel
              meta={meta}
              value={draft}
              onChange={setDraft}
              onApply={onApply}
              onReset={onReset}
              loading={loading}
            />

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                {activeFilterLabels.length} active filter groups
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                {currentPage?.label}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Drag, resize, save layout
              </span>
            </div>

            <KpiCards summary={summary} />

            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  )
}