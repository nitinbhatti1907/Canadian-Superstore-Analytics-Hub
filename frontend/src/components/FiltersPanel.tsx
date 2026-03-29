import { useEffect, useMemo, useState } from 'react'
import Select, { type StylesConfig } from 'react-select'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import type { Filters, Meta } from '../types'

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]

type Option = {
  value: string
  label: string
}

type Props = {
  meta: Meta | null
  value: Filters
  onChange: (next: Filters) => void
  onApply: () => void
  onReset: () => void
  loading?: boolean
}

function toOptions(values: string[]) {
  return values.map((v) => ({ value: v, label: v }))
}

function mapValues(items: any): string[] {
  if (!items) return []
  return items.map((i: any) => i.value)
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

function lastDayOfMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

const selectStyles: StylesConfig<Option, true> | StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '48px',
    borderRadius: '14px',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderColor: state.isFocused ? 'rgba(34, 211, 238, 0.55)' : 'rgba(148, 163, 184, 0.18)',
    boxShadow: 'none',
    ':hover': {
      borderColor: 'rgba(34, 211, 238, 0.42)'
    }
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#0f172a',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '14px',
    overflow: 'hidden',
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? 'rgba(34, 211, 238, 0.12)' : '#0f172a',
    color: '#e2e8f0',
    cursor: 'pointer'
  }),
  singleValue: (base) => ({
    ...base,
    color: '#e2e8f0'
  }),
  input: (base) => ({
    ...base,
    color: '#e2e8f0'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#94a3b8'
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderRadius: '10px'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#cffafe'
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#67e8f9',
    ':hover': {
      backgroundColor: 'rgba(6, 182, 212, 0.16)',
      color: '#ecfeff'
    }
  })
}

export default function FiltersPanel({ meta, value, onChange, onApply, onReset, loading }: Props) {
  const portalTarget = typeof window !== 'undefined' ? document.body : null

  const options = useMemo(() => {
    if (!meta) return null
    return {
      subCategories: toOptions(meta.sub_categories),
      regions: toOptions(meta.regions),
      states: toOptions(meta.states),
      cities: toOptions(meta.cities)
    }
  }, [meta])

  const years = useMemo(() => {
    if (!meta?.date_min || !meta?.date_max) return []
    const y0 = Number(meta.date_min.slice(0, 4))
    const y1 = Number(meta.date_max.slice(0, 4))
    const arr: number[] = []
    for (let y = y0; y <= y1; y++) arr.push(y)
    return arr
  }, [meta])

  const yearOptions = useMemo(
    () => [{ value: '', label: 'All Years' }, ...years.map((y) => ({ value: String(y), label: String(y) }))],
    [years]
  )

  const [year, setYear] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [day, setDay] = useState<string>('')
  const [isCustomRange, setIsCustomRange] = useState(false)

  function applyYmdToFilters(nextYear: string, nextMonth: string, nextDay: string) {
    const next: Filters = { ...value }
    setIsCustomRange(false)

    if (!nextYear) {
      if (meta?.date_min) next.start_date = meta.date_min
      else delete next.start_date

      if (meta?.date_max) next.end_date = meta.date_max
      else delete next.end_date

      onChange(next)
      return
    }

    const y = Number(nextYear)

    if (!nextMonth) {
      next.start_date = `${y}-01-01`
      next.end_date = `${y}-12-31`
      onChange(next)
      return
    }

    const m = Number(nextMonth)

    if (!nextDay) {
      next.start_date = isoDate(y, m, 1)
      next.end_date = isoDate(y, m, lastDayOfMonth(y, m))
      onChange(next)
      return
    }

    const d = Number(nextDay)
    const one = isoDate(y, m, d)
    next.start_date = one
    next.end_date = one
    onChange(next)
  }

  useEffect(() => {
    if (!meta?.date_min || !meta?.date_max) return

    const s = value.start_date
    const e = value.end_date

    if (s === meta.date_min && e === meta.date_max) {
      setYear('')
      setMonth('')
      setDay('')
      setIsCustomRange(false)
      return
    }

    if (!s || !e) {
      setYear('')
      setMonth('')
      setDay('')
      setIsCustomRange(false)
      return
    }

    if (s === e) {
      setYear(s.slice(0, 4))
      setMonth(String(Number(s.slice(5, 7))))
      setDay(String(Number(s.slice(8, 10))))
      setIsCustomRange(false)
      return
    }

    if (s.endsWith('-01-01') && e.endsWith('-12-31') && s.slice(0, 4) === e.slice(0, 4)) {
      setYear(s.slice(0, 4))
      setMonth('')
      setDay('')
      setIsCustomRange(false)
      return
    }

    const sy = Number(s.slice(0, 4))
    const sm = Number(s.slice(5, 7))
    const ey = Number(e.slice(0, 4))
    const em = Number(e.slice(5, 7))
    const sd = Number(s.slice(8, 10))
    const ed = Number(e.slice(8, 10))

    if (sy === ey && sm === em && sd === 1 && ed === lastDayOfMonth(sy, sm)) {
      setYear(String(sy))
      setMonth(String(sm))
      setDay('')
      setIsCustomRange(false)
      return
    }

    setYear('')
    setMonth('')
    setDay('')
    setIsCustomRange(true)
  }, [meta, value.start_date, value.end_date])

  const daysInSelectedMonth = useMemo(() => {
    if (!year || !month) return []
    const y = Number(year)
    const m = Number(month)
    const last = lastDayOfMonth(y, m)
    return Array.from({ length: last }, (_, i) => String(i + 1))
  }, [year, month])

  const dayOptions = useMemo(() => {
    const base = [{ value: '', label: 'All Days' }]
    if (!year || !month) return base
    return base.concat(daysInSelectedMonth.map((d) => ({ value: d, label: d })))
  }, [year, month, daysInSelectedMonth])

  const minDate = meta?.date_min ? new Date(meta.date_min) : undefined
  const maxDate = meta?.date_max ? new Date(meta.date_max) : undefined
  const startDate = value.start_date ? new Date(value.start_date) : null
  const endDate = value.end_date ? new Date(value.end_date) : null

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-soft backdrop-blur">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Filter control</div>
          <h3 className="mt-1 text-lg font-semibold text-white">Global Filters</h3>
          <p className="mt-1 text-sm text-slate-400">
            Use these filters and click Apply. Every chart on every page will update together.
          </p>
          {isCustomRange && (
            <p className="mt-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
              Custom date range is active
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onApply}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Apply'}
          </button>
          <button
            onClick={onReset}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
          <div className="mb-3 text-sm font-semibold text-slate-200">Quick date drill-down</div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Year</label>
              <Select
                styles={selectStyles as any}
                menuPortalTarget={portalTarget ?? undefined}
                menuPosition="fixed"
                menuPlacement="auto"
                options={yearOptions}
                value={yearOptions.find((o) => o.value === year) ?? yearOptions[0]}
                onChange={(opt) => {
                  const nextYear = opt?.value ?? ''
                  setYear(nextYear)
                  setMonth('')
                  setDay('')
                  applyYmdToFilters(nextYear, '', '')
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Month</label>
              <Select
                styles={selectStyles as any}
                menuPortalTarget={portalTarget ?? undefined}
                menuPosition="fixed"
                menuPlacement="auto"
                options={MONTHS}
                value={MONTHS.find((o) => o.value === month) ?? MONTHS[0]}
                onChange={(opt) => {
                  const nextMonth = opt?.value ?? ''
                  setMonth(nextMonth)
                  setDay('')
                  applyYmdToFilters(year, nextMonth, '')
                }}
                isDisabled={!year}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Day</label>
              <Select
                styles={selectStyles as any}
                menuPortalTarget={portalTarget ?? undefined}
                menuPosition="fixed"
                menuPlacement="auto"
                options={dayOptions}
                value={dayOptions.find((o) => o.value === day) ?? dayOptions[0]}
                onChange={(opt) => {
                  const nextDay = opt?.value ?? ''
                  setDay(nextDay)
                  applyYmdToFilters(year, month, nextDay)
                }}
                isDisabled={!year || !month}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Category</label>
            <Select
              styles={selectStyles as any}
              menuPortalTarget={portalTarget ?? undefined}
              menuPosition="fixed"
              menuPlacement="auto"
              isMulti
              options={options?.subCategories ?? []}
              value={(value.sub_category ?? []).map((v) => ({ value: v, label: v }))}
              onChange={(items) => onChange({ ...value, sub_category: mapValues(items) })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Region</label>
            <Select
              styles={selectStyles as any}
              menuPortalTarget={portalTarget ?? undefined}
              menuPosition="fixed"
              menuPlacement="auto"
              isMulti
              options={options?.regions ?? []}
              value={(value.region ?? []).map((v) => ({ value: v, label: v }))}
              onChange={(items) => onChange({ ...value, region: mapValues(items) })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Province / State</label>
            <Select
              styles={selectStyles as any}
              menuPortalTarget={portalTarget ?? undefined}
              menuPosition="fixed"
              menuPlacement="auto"
              isMulti
              options={options?.states ?? []}
              value={(value.state ?? []).map((v) => ({ value: v, label: v }))}
              onChange={(items) => onChange({ ...value, state: mapValues(items) })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">City</label>
            <Select
              styles={selectStyles as any}
              menuPortalTarget={portalTarget ?? undefined}
              menuPosition="fixed"
              menuPlacement="auto"
              isMulti
              options={options?.cities ?? []}
              value={(value.city ?? []).map((v) => ({ value: v, label: v }))}
              onChange={(items) => onChange({ ...value, city: mapValues(items) })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Custom Start Date</label>
            <DatePicker
              className="w-full rounded-xl border border-white/10 bg-slate-900/75 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
              selected={startDate}
              onChange={(date) => {
                const next = { ...value }
                setIsCustomRange(true)
                if (!date) delete next.start_date
                else next.start_date = date.toISOString().slice(0, 10)
                onChange(next)
              }}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Start date"
              dateFormat="yyyy-MM-dd"
              isClearable
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">Custom End Date</label>
            <DatePicker
              className="w-full rounded-xl border border-white/10 bg-slate-900/75 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60"
              selected={endDate}
              onChange={(date) => {
                const next = { ...value }
                setIsCustomRange(true)
                if (!date) delete next.end_date
                else next.end_date = date.toISOString().slice(0, 10)
                onChange(next)
              }}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="End date"
              dateFormat="yyyy-MM-dd"
              isClearable
            />
          </div>
        </div>
      </div>
    </div>
  )
}