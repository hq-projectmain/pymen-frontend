import { Business, Product, Sale } from '../types'

// ─── Datos iniciales ──────────────────────────────────────────────────────────

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 1,
    name: 'Ferretería El Tornillo',
    email: 'contacto@eltornillo.com',
    status: true,
    createdAt: '2024-02-15',
    products: [
      { id: 11, name: 'Taladro Percutor',    desc: 'Taladro 750W con maletín',      price: 95000, stock: 14, status: true  },
      { id: 12, name: 'Set Destornilladores', desc: 'Juego 12 piezas',               price: 22000, stock: 30, status: true  },
      { id: 13, name: 'Cinta Métrica 5m',    desc: 'Cinta con traba automática',    price:  8500, stock:  0, status: false },
    ],
    sales: [
      { id: 'VTA-001', date: '2025-05-20', items: [{ pid: 11, qty: 1 }, { pid: 12, qty: 2 }] },
      { id: 'VTA-002', date: '2025-06-02', items: [{ pid: 12, qty: 5 }] },
      { id: 'VTA-003', date: '2025-06-08', items: [{ pid: 11, qty: 2 }] },
    ],
  },
  {
    id: 2,
    name: 'Panadería Doña Rosa',
    email: 'rosa@panaderia.com',
    status: true,
    createdAt: '2024-06-30',
    products: [
      { id: 21, name: 'Pan Casero (kg)',  desc: 'Pan artesanal por kilo',  price: 2800, stock: 50, status: true },
      { id: 22, name: 'Docena Facturas', desc: 'Surtido de facturas',      price: 4500, stock: 25, status: true },
    ],
    sales: [
      { id: 'VTA-001', date: '2025-06-05', items: [{ pid: 21, qty: 3 }, { pid: 22, qty: 2 }] },
      { id: 'VTA-002', date: '2025-06-09', items: [{ pid: 22, qty: 1 }] },
    ],
  },
  {
    id: 3,
    name: 'TechStore Córdoba',
    email: 'ventas@techstore.com',
    status: false,
    createdAt: '2025-01-10',
    products: [
      { id: 31, name: 'Auriculares BT', desc: 'Auriculares inalámbricos', price: 45000, stock: 20, status: true },
    ],
    sales: [
      { id: 'VTA-001', date: '2025-04-12', items: [{ pid: 31, qty: 4 }] },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const fmtDate = (d: string): string =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtMoney = (n: number): string =>
  `$${Number(n).toLocaleString('es-AR')}`

export const saleTotal = (sale: Sale, products: Product[]): number =>
  sale.items.reduce((acc, it) => {
    const p = products.find((p) => p.id === it.pid)
    return acc + (p ? p.price * it.qty : 0)
  }, 0)

export const bizRevenue = (b: Business): number =>
  b.sales.reduce((total, s) => total + saleTotal(s, b.products), 0)
