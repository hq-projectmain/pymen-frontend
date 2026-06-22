export interface Product {
  id: number
  name: string
  desc: string
  price: number
  stock: number
  status: boolean
}

export interface SaleItem {
  pid: number
  qty: number
}

export interface Sale {
  id: string
  date: string
  items: SaleItem[]
}

export interface Business {
  id: number
  name: string
  email: string
  status: boolean
  createdAt: string
  products: Product[]
  sales: Sale[]
}

export type BusinessTab = 'dashboard' | 'products' | 'sales'
export type ModalType = 'newProduct' | 'editProduct' | 'newSale' | null
