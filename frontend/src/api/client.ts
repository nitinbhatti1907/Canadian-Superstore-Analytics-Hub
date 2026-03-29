import type { Filters } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function appendMulti(params: URLSearchParams, key: string, values?: string[]) {
  if (!values || values.length === 0) return
  params.set(key, values.join(','))
}

export function buildQuery(filters: Filters, extra: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams()

  if (filters.start_date) params.set('start_date', filters.start_date)
  if (filters.end_date) params.set('end_date', filters.end_date)

  appendMulti(params, 'category', filters.category)
  appendMulti(params, 'sub_category', filters.sub_category)
  appendMulti(params, 'segment', filters.segment)
  appendMulti(params, 'region', filters.region)
  appendMulti(params, 'state', filters.state)
  appendMulti(params, 'city', filters.city)
  appendMulti(params, 'ship_mode', filters.ship_mode)
  appendMulti(params, 'order_priority', filters.order_priority)

  if (filters.min_discount !== undefined) params.set('min_discount', String(filters.min_discount))
  if (filters.max_discount !== undefined) params.set('max_discount', String(filters.max_discount))

  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) {
      params.set(k, String(v))
    }
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`API ${res.status}: ${txt}`)
  }
  return res.json() as Promise<T>
}