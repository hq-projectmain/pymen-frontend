import { authService } from './authServices'

export type SupplierVatCondition =
  | 'responsable_inscripto'
  | 'monotributo'
  | 'exento'
  | 'consumidor_final'
  | 'otro'

export interface Supplier {
  id: string
  cuit: string | null
  legalName: string | null
  tradeName: string | null
  vatCondition: SupplierVatCondition | null
  address: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierData {
  cuit: string
  legalName: string
  tradeName?: string
  vatCondition: SupplierVatCondition
  address?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
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
    throw new Error(message || 'No se pudo completar la operación de proveedores')
  }
  return response.json() as Promise<T>
}

export const supplierService = {
  list: () => request<Supplier[]>('/suppliers'),
  create: (data: CreateSupplierData) => request<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateSupplierData>) => request<Supplier>(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deactivate: (id: string) => request<Supplier>(`/suppliers/${id}`, { method: 'DELETE' }),
}
