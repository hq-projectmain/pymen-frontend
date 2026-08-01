import { useEffect, useMemo, useState } from 'react'
import { productService, type Product } from '../../../services/productService'
import {
  purchaseService,
  type CreatePurchaseData,
  type Purchase,
  type PurchaseVoucherType,
} from '../../../services/purchaseService'
import { supplierService, type Supplier } from '../../../services/supplierService'
import { C, T } from '../../../styles/theme'
import { Modal } from '../../ui/Modal'

interface PurchaseFormItem {
  productId: string
  quantity: number
  unitCost: number
  vatRate: number
}

interface PurchaseForm {
  idempotencyKey: string
  supplierId: string
  voucherType: PurchaseVoucherType
  pointOfSale: number
  voucherNumber: number
  voucherDate: string
  cae: string
  otherAmount: number
  items: PurchaseFormItem[]
}

const argentineToday = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}
const emptyItem = (): PurchaseFormItem => ({ productId: '', quantity: 1, unitCost: 0, vatRate: 21 })
const emptyForm = (): PurchaseForm => ({
  idempotencyKey: crypto.randomUUID(),
  supplierId: '',
  voucherType: 'A',
  pointOfSale: 1,
  voucherNumber: 1,
  voucherDate: argentineToday(),
  cae: '',
  otherAmount: 0,
  items: [emptyItem()],
})
const money = (value: number) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const voucherLabel: Record<PurchaseVoucherType, string> = { A: 'Factura A', B: 'Factura B', C: 'Factura C', remito: 'Remito', otro: 'Otro' }
const statusLabel = { draft: 'Borrador', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const inputStyle = {
  width: '100%',
  background: C.black,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 12px',
  color: C.white,
  fontSize: 13,
  boxSizing: 'border-box' as const,
}

export default function PurchasesView() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PurchaseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError('')
      const [purchaseData, supplierData, productData] = await Promise.all([
        purchaseService.list(),
        supplierService.list(),
        productService.getProducts(),
      ])
      setPurchases(purchaseData)
      setSuppliers(supplierData)
      setProducts(productData)
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las compras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const totals = useMemo(() => {
    const amounts = form.items.reduce((result, item) => {
      const itemNet = roundMoney(item.quantity * item.unitCost)
      return {
        net: result.net + itemNet,
        vat: result.vat + roundMoney(itemNet * item.vatRate / 100),
      }
    }, { net: 0, vat: 0 })
    const net = roundMoney(amounts.net)
    const vat = roundMoney(amounts.vat)
    return { net, vat, total: roundMoney(net + vat + Number(form.otherAmount || 0)) }
  }, [form])

  function updateItem(index: number, key: keyof PurchaseFormItem, raw: string) {
    setForm(current => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index
        ? { ...item, [key]: key === 'productId' ? raw : Number(raw) }
        : item),
    }))
  }

  async function createDraft() {
    const productIds = form.items.map(item => item.productId)
    if (!form.supplierId || form.items.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.unitCost < 0)) {
      setSaveError('Completá proveedor, productos, cantidades enteras y costos válidos.')
      return
    }
    if (new Set(productIds).size !== productIds.length) {
      setSaveError('Cada producto debe aparecer una sola vez en la compra.')
      return
    }
    if (form.voucherType !== 'otro' && (!form.pointOfSale || !form.voucherNumber)) {
      setSaveError('El comprobante requiere punto de venta y número.')
      return
    }
    try {
      setSaving(true)
      setSaveError('')
      const payload: CreatePurchaseData = {
        supplierId: form.supplierId,
        voucherType: form.voucherType,
        voucherDate: form.voucherDate,
        idempotencyKey: form.idempotencyKey,
        otherAmount: Number(form.otherAmount || 0),
        items: form.items,
      }
      if (form.voucherType !== 'otro') {
        payload.pointOfSale = form.pointOfSale
        payload.voucherNumber = form.voucherNumber
      }
      if (form.cae.trim()) payload.cae = form.cae.trim()
      await purchaseService.createDraft(payload)
      setForm(emptyForm())
      setShowForm(false)
      await load()
    } catch (cause: unknown) {
      setSaveError(cause instanceof Error ? cause.message : 'No se pudo crear el borrador')
    } finally {
      setSaving(false)
    }
  }

  async function confirm(purchase: Purchase) {
    if (!window.confirm(`Confirmar la compra por ${money(purchase.totalAmount)}? Esta acción aumentará el stock y no puede deshacerse.`)) return
    try {
      setActionId(purchase.id)
      setError('')
      await purchaseService.confirm(purchase.id)
      await load()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo confirmar la compra')
    } finally {
      setActionId(null)
    }
  }

  async function cancel(purchase: Purchase) {
    if (!window.confirm('¿Cancelar este borrador? No se modificará el stock.')) return
    try {
      setActionId(purchase.id)
      setError('')
      await purchaseService.cancel(purchase.id)
      await load()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cancelar la compra')
    } finally {
      setActionId(null)
    }
  }

  const activeSuppliers = suppliers.filter(supplier => supplier.isActive && supplier.cuit && supplier.legalName)
  const activeProducts = products.filter(product => product.isActive)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={T.pageHead}>Compras</div>
          <div style={T.pageSub}>Recepción de comprobantes y actualización controlada de stock</div>
        </div>
        <button style={T.btnPrimary} disabled={!activeSuppliers.length || !activeProducts.length} onClick={() => { setForm(emptyForm()); setSaveError(''); setShowForm(true) }}>+ Registrar compra</button>
      </div>

      {!activeSuppliers.length && !loading ? <p style={{ color: C.gray }}>Necesitás al menos un proveedor activo y completo para registrar compras.</p> : null}
      {loading ? <p role="status" aria-live="polite" style={{ color: C.lime }}>Cargando compras...</p> : null}
      {error ? <p role="alert" style={{ color: C.red }}>{error}</p> : null}
      {!loading && !error && !purchases.length ? <p style={T.pageSub}>Aún no hay compras registradas.</p> : null}

      {!loading && purchases.length ? (
        <div style={{ ...T.card, overflowX: 'auto' }}>
          <table style={T.table}>
            <thead><tr>{['Fecha', 'Proveedor', 'Comprobante', 'Total', 'Estado', 'Acciones'].map(label => <th key={label} style={T.th}>{label}</th>)}</tr></thead>
            <tbody>
              {purchases.map(purchase => (
                <tr key={purchase.id}>
                  <td style={T.td}>{new Date(`${purchase.voucherDate}T00:00:00`).toLocaleDateString('es-AR')}</td>
                  <td style={T.tdW}>{purchase.supplier?.legalName ?? 'Proveedor'}</td>
                  <td style={T.td}>{voucherLabel[purchase.voucherType]}{purchase.pointOfSale && purchase.voucherNumber ? ` ${String(purchase.pointOfSale).padStart(5, '0')}-${String(purchase.voucherNumber).padStart(8, '0')}` : ''}</td>
                  <td style={{ ...T.tdW, color: C.lime }}>{money(purchase.totalAmount)}</td>
                  <td style={{ ...T.td, color: purchase.status === 'confirmed' ? C.lime : purchase.status === 'cancelled' ? C.red : C.gray }}>{statusLabel[purchase.status]}</td>
                  <td style={T.td}>
                    {purchase.status === 'draft' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={T.btnPrimary} disabled={actionId === purchase.id} onClick={() => void confirm(purchase)}>Confirmar ingreso</button>
                        <button style={T.btnGhost} disabled={actionId === purchase.id} onClick={() => void cancel(purchase)}>Cancelar</button>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showForm ? (
        <Modal title="Registrar compra recibida" width={920} onClose={() => setShowForm(false)}>
          <p style={{ ...T.pageSub, marginBottom: 16 }}>Primero se guarda como borrador. El stock cambia únicamente cuando confirmás el ingreso.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
            <label style={{ color: C.gray, fontSize: 12 }}>Proveedor<select style={{ ...inputStyle, marginTop: 6 }} value={form.supplierId} onChange={event => setForm(current => ({ ...current, supplierId: event.target.value }))}><option value="">Seleccionar...</option>{activeSuppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.legalName} · {supplier.cuit}</option>)}</select></label>
            <label style={{ color: C.gray, fontSize: 12 }}>Tipo<select style={{ ...inputStyle, marginTop: 6 }} value={form.voucherType} onChange={event => setForm(current => ({ ...current, voucherType: event.target.value as PurchaseVoucherType }))}>{Object.entries(voucherLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label style={{ color: C.gray, fontSize: 12 }}>Fecha<input type="date" style={{ ...inputStyle, marginTop: 6 }} value={form.voucherDate} onChange={event => setForm(current => ({ ...current, voucherDate: event.target.value }))} /></label>
            {form.voucherType !== 'otro' ? <label style={{ color: C.gray, fontSize: 12 }}>Punto de venta<input type="number" min="1" style={{ ...inputStyle, marginTop: 6 }} value={form.pointOfSale} onChange={event => setForm(current => ({ ...current, pointOfSale: Number(event.target.value) }))} /></label> : null}
            {form.voucherType !== 'otro' ? <label style={{ color: C.gray, fontSize: 12 }}>Número<input type="number" min="1" style={{ ...inputStyle, marginTop: 6 }} value={form.voucherNumber} onChange={event => setForm(current => ({ ...current, voucherNumber: Number(event.target.value) }))} /></label> : null}
            <label style={{ color: C.gray, fontSize: 12 }}>CAE (opcional)<input style={{ ...inputStyle, marginTop: 6 }} value={form.cae} onChange={event => setForm(current => ({ ...current, cae: event.target.value }))} /></label>
          </div>

          <div style={{ ...T.sectionTitle, marginBottom: 10 }}>Productos recibidos</div>
          {form.items.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <select aria-label={`Producto ${index + 1}`} style={inputStyle} value={item.productId} onChange={event => updateItem(index, 'productId', event.target.value)}><option value="">Producto...</option>{activeProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
              <input aria-label={`Cantidad ${index + 1}`} type="number" min="1" step="1" style={inputStyle} value={item.quantity} onChange={event => updateItem(index, 'quantity', event.target.value)} />
              <input aria-label={`Costo unitario ${index + 1}`} type="number" min="0" step="0.01" style={inputStyle} value={item.unitCost || ''} placeholder="Costo unit." onChange={event => updateItem(index, 'unitCost', event.target.value)} />
              <select aria-label={`IVA ${index + 1}`} style={inputStyle} value={item.vatRate} onChange={event => updateItem(index, 'vatRate', event.target.value)}>{[0, 2.5, 5, 10.5, 21, 27].map(rate => <option key={rate} value={rate}>IVA {rate}%</option>)}</select>
              <button aria-label={`Quitar producto ${index + 1}`} style={{ ...T.btnGhost, color: C.red, minHeight: 40 }} disabled={form.items.length === 1} onClick={() => setForm(current => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}>Quitar</button>
            </div>
          ))}
          <button style={{ ...T.btnGhost, marginBottom: 18 }} disabled={form.items.length >= 200} onClick={() => setForm(current => ({ ...current, items: [...current.items, emptyItem()] }))}>+ Agregar producto</button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, alignItems: 'end', background: C.black, padding: 14, borderRadius: 10 }}>
            <label style={{ color: C.gray, fontSize: 12 }}>Otros importes<input type="number" min="0" step="0.01" style={{ ...inputStyle, marginTop: 6 }} value={form.otherAmount || ''} onChange={event => setForm(current => ({ ...current, otherAmount: Number(event.target.value) }))} /></label>
            <div><div style={T.pageSub}>Neto</div><strong>{money(totals.net)}</strong></div>
            <div><div style={T.pageSub}>IVA</div><strong>{money(totals.vat)}</strong></div>
            <div><div style={T.pageSub}>Total</div><strong style={{ color: C.lime, fontSize: 20 }}>{money(totals.total)}</strong></div>
          </div>
          {saveError ? <p role="alert" style={{ color: C.red, fontSize: 13 }}>{saveError}</p> : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button style={{ ...T.btnPrimary, flex: 1 }} disabled={saving} onClick={() => void createDraft()}>{saving ? 'Guardando...' : 'Guardar borrador'}</button>
            <button style={T.btnGhost} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
