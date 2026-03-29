export type Meta = {
  date_min: string | null
  date_max: string | null
  categories: string[]
  sub_categories: string[]
  segments: string[]
  regions: string[]
  states: string[]
  cities: string[]
  ship_modes: string[]
  order_priorities: string[]
}

export type Filters = {
  start_date?: string
  end_date?: string
  category?: string[]
  sub_category?: string[]
  segment?: string[]
  region?: string[]
  state?: string[]
  city?: string[]
  ship_mode?: string[]
  order_priority?: string[]
  min_discount?: number
  max_discount?: number
}

export type Summary = {
  rows: number
  orders: number
  customers: number
  total_sales: number
  total_profit: number
  profit_margin: number
  total_quantity: number
  avg_discount: number
}

export type TimePoint = {
  date: string
  sales: number
  profit: number
  quantity: number
}

export type NamedMetric = {
  name: string
  sales: number
  profit: number
  orders?: number
  quantity?: number
}

export type DiscountImpact = {
  discount_range: string
  sales: number
  profit: number
  avg_margin: number
  rows: number
}

export type RfmSegment = {
  segment: string
  customers: number
  sales: number
  profit: number
}

export type BasketPair = {
  product_a: string
  product_b: string
  count: number
}

export type RowsResponse = {
  total: number
  limit: number
  offset: number
  items: Record<string, any>[]
}