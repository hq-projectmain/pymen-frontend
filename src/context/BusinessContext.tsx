import { createContext, useContext, useState, ReactNode } from 'react'
import { Business, BusinessTab, ModalType, Product, Sale } from '../types'
import { INITIAL_BUSINESSES } from '../services/businessService'

// ─── Tipos del contexto ───────────────────────────────────────────────────────

interface BusinessContextValue {
  // Estado
  businesses: Business[]
  view: 'admin' | number
  bizTab: BusinessTab
  modal: ModalType
  saleDetail: Sale | null

  // Navegación
  enterBiz: (b: Business) => void
  exitBiz: () => void
  setBizTab: (tab: BusinessTab) => void
  setSaleDetail: (sale: Sale | null) => void
  setModal: (modal: ModalType) => void

  // Acciones sobre negocios
  toggleBiz: (id: number) => void

  // Acciones sobre productos
  addProduct: (data: Omit<Product, 'id' | 'status'>) => void
  editProduct: (id: number, data: Partial<Omit<Product, 'id'>>) => void
  toggleProduct: (id: number) => void

  // Acciones sobre ventas
  addSale: (items: { pid: number; qty: number }[]) => void
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const BusinessContext = createContext<BusinessContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(INITIAL_BUSINESSES)
  const [view, setView]             = useState<'admin' | number>('admin')
  const [bizTab, setBizTab]         = useState<BusinessTab>('dashboard')
  const [modal, setModal]           = useState<ModalType>(null)
  const [saleDetail, setSaleDetail] = useState<Sale | null>(null)

  /** Aplica una transformación al negocio activo */
  const patchCurrentBiz = (fn: (b: Business) => Business) =>
    setBusinesses((bs) => bs.map((b) => (b.id === view ? fn(b) : b)))

  // ── Navegación ──────────────────────────────────────────────────────────────

  const enterBiz = (b: Business) => {
    setView(b.id)
    setBizTab('dashboard')
    setSaleDetail(null)
  }

  const exitBiz = () => {
    setView('admin')
    setSaleDetail(null)
  }

  // ── Negocios ────────────────────────────────────────────────────────────────

  const toggleBiz = (id: number) =>
    setBusinesses((bs) =>
      bs.map((b) => (b.id === id ? { ...b, status: !b.status } : b))
    )

  // ── Productos ───────────────────────────────────────────────────────────────

  const addProduct = (data: Omit<Product, 'id' | 'status'>) =>
    patchCurrentBiz((b) => ({
      ...b,
      products: [...b.products, { id: Date.now(), ...data, status: true }],
    }))

  const editProduct = (id: number, data: Partial<Omit<Product, 'id'>>) =>
    patchCurrentBiz((b) => ({
      ...b,
      products: b.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }))

  const toggleProduct = (id: number) =>
    patchCurrentBiz((b) => ({
      ...b,
      products: b.products.map((p) =>
        p.id === id ? { ...p, status: !p.status } : p
      ),
    }))

  // ── Ventas ──────────────────────────────────────────────────────────────────

  const addSale = (items: { pid: number; qty: number }[]) =>
    patchCurrentBiz((b) => ({
      ...b,
      sales: [
        ...b.sales,
        {
          id: `VTA-${String(b.sales.length + 1).padStart(3, '0')}`,
          date: new Date().toISOString().slice(0, 10),
          items,
        },
      ],
    }))

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        view,
        bizTab,
        modal,
        saleDetail,
        enterBiz,
        exitBiz,
        toggleBiz,
        setBizTab,
        setSaleDetail,
        setModal,
        addProduct,
        editProduct,
        toggleProduct,
        addSale,
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBusinessContext(): BusinessContextValue {
  const ctx = useContext(BusinessContext)
  if (!ctx)
    throw new Error('useBusinessContext debe usarse dentro de <BusinessProvider>')
  return ctx
}
