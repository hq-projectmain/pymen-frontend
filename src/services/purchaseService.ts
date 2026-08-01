import { authService } from './authServices'
import type { Supplier } from './supplierService'

export type PurchaseStatus = 'draft' | 'confirmed' | 'cancelled'
export type PurchaseVoucherType = 'A' | 'B' | 'C' | 'remito' | 'otro'

export interface PurchaseItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitCost: number
  vatRate: number
  netAmount: number
  vatAmount: number
  totalAmount: number
}

export interface Purchase {
  id: string
  supplierId: string
  supplier: Supplier
  status: PurchaseStatus
  voucherType: PurchaseVoucherType
  pointOfSale: number | null
  voucherNumber: string | null
  voucherDate: string
  netAmount: number
  vatAmount: number
  otherAmount: number
  totalAmount: number
  cae: string | null
  items: PurchaseItem[]
  createdAt: string
  confirmedAt: string | null
  cancelledAt: string | null
}

export interface CreatePurchaseData {
  supplierId: string
  voucherType: PurchaseVoucherType
  pointOfSale?: number
  voucherNumber?: number
  voucherDate: string
  cae?: string
  otherAmount?: number
  idempotencyKey: string
  items: Array<{
    productId: string
    quantity: number
    unitCost: number
    vatRate: number
  }>
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/pymen'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await authService.getSession()
  if (!session?.access_token) throw new Error('No hay sesión activa')
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null
    const message = Array.isArray(body?.message) ? body.message.join('. ') : body?.message
    throw new Error(message || 'No se pudo completar la operación de compras')
  }
  return response.json() as Promise<T>
}

export const purchaseService = {
  list: () => request<Purchase[]>('/purchases'),
  createDraft: (data: CreatePurchaseData) => request<Purchase>('/purchases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirm: (id: string) => request<Purchase>(`/purchases/${id}/confirm`, { method: 'POST' }),
  cancel: (id: string) => request<Purchase>(`/purchases/${id}/cancel`, { method: 'POST' }),
}
