import { authService } from './authServices'

export type ArcaEnvironment = 'homologation' | 'production'

export interface ArcaCredentialStatus {
  configured: boolean
  source: 'encrypted_database' | 'server_files' | null
  fingerprint: string | null
  subject: string | null
  validFrom: string | null
  validTo: string | null
  updatedAt: string | null
}

export interface ArcaConfig {
  cuit: string
  puntoVenta: number
  condicionIva: string
  environment: ArcaEnvironment
  expectedSecretLocation: string | null
  credentials: ArcaCredentialStatus
  businessName: string | null
  fiscalAddress: string | null
  updatedAt: string
}

export interface ArcaInvoiceContext {
  configured: boolean
  canInvoice: boolean
  environment?: ArcaEnvironment
  puntoVenta?: number
  message?: string
}

export interface SaveArcaConfig {
  cuit: string
  puntoVenta: number
  condicionIva: string
  environment: ArcaEnvironment
  businessName?: string
  fiscalAddress?: string
}

export interface ArcaVatLine {
  id: number
  baseAmount: number
  amount: number
}

export interface CreateArcaInvoice {
  voucherType: 1 | 6 | 11
  concept: 1 | 2 | 3
  receiverDocumentType: number
  receiverDocumentNumber: string
  receiverVatConditionId: number
  nonTaxedAmount?: number
  exemptAmount?: number
  vat?: ArcaVatLine[]
  serviceFrom?: string
  serviceTo?: string
  paymentDueDate?: string
  currency?: string
  exchangeRate?: number
}

export interface ArcaInvoiceResult {
  invoiceId: string
  message: string
  pointOfSale: number
  voucherType: number
  voucherNumber: number
  cae: string
  caeExpiration: string
  observations: Array<{ code: number; message: string }>
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/pymen'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await authService.getSession()
  if (!session?.access_token) throw new ApiError('No hay sesión activa', 401)

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const payload = await response.json().catch(() => null) as { message?: string | string[] } | T | null
  if (!response.ok) {
    const rawMessage = payload && typeof payload === 'object' && 'message' in payload
      ? payload.message
      : undefined
    const message = Array.isArray(rawMessage) ? rawMessage.join('. ') : rawMessage
    throw new ApiError(message || 'No se pudo completar la operación con ARCA', response.status)
  }

  return payload as T
}

export const arcaService = {
  getConfig: () => request<ArcaConfig>('/arca/config'),

  getInvoiceContext: () => request<ArcaInvoiceContext>('/arca/invoice-context'),

  saveConfig: (data: SaveArcaConfig) => request<{ message: string; data: ArcaConfig }>('/arca/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  activate: () => request<{ is_active: boolean }>('/arca/activate', { method: 'POST' }),

  testConnection: () => request<Record<string, unknown>>('/arca/test-connection'),

  saveCredentials: (certificatePem: string, privateKeyPem: string) => request<{
    message: string
    credentials: ArcaCredentialStatus
  }>('/arca/credentials', {
    method: 'PUT',
    body: JSON.stringify({ certificatePem, privateKeyPem }),
  }),

  createInvoice: (saleId: string, data: CreateArcaInvoice) => request<ArcaInvoiceResult>(
    `/arca/invoice/${saleId}`,
    { method: 'POST', body: JSON.stringify(data) },
  ),
}
