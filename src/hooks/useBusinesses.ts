import { useBusinessContext } from '../context/BusinessContext'
import { bizRevenue, saleTotal } from '../services/businessService'
import { Business, Sale, Product } from '../types'

// ─── Hook: negocio activo ─────────────────────────────────────────────────────

export function useCurrentBusiness(): Business | null {
  const { businesses, view } = useBusinessContext()
  return businesses.find((b) => b.id === view) ?? null
}

// ─── Hook: estadísticas globales (vista admin) ────────────────────────────────

export function useAdminStats() {
  const { businesses } = useBusinessContext()
  return {
    total:         businesses.length,
    active:        businesses.filter((b) => b.status).length,
    totalProducts: businesses.reduce((a, b) => a + b.products.length, 0),
    totalRevenue:  businesses.reduce((a, b) => a + bizRevenue(b), 0),
  }
}

// ─── Hook: estadísticas de un negocio puntual ────────────────────────────────

export function useBusinessStats(id: number) {
  const { businesses } = useBusinessContext()
  const biz = businesses.find((b) => b.id === id)
  if (!biz) return null
  return {
    products:       biz.products.length,
    activeProducts: biz.products.filter((p) => p.status).length,
    sales:          biz.sales.length,
    revenue:        bizRevenue(biz),
  }
}

// Re-exportamos saleTotal para que los componentes no importen desde services
export { saleTotal }
export type { Sale, Product }
