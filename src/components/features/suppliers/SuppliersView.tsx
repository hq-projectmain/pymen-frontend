import { useEffect, useState } from 'react'
import {
  supplierService,
  type CreateSupplierData,
  type Supplier,
  type SupplierVatCondition,
} from '../../../services/supplierService'
import { C, T } from '../../../styles/theme'
import { Input } from '../../ui/Input'
import { Modal } from '../../ui/Modal'

const EMPTY_FORM: CreateSupplierData = {
  cuit: '',
  legalName: '',
  tradeName: '',
  vatCondition: 'responsable_inscripto',
  address: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

const VAT_LABELS: Record<SupplierVatCondition, string> = {
  responsable_inscripto: 'Responsable inscripto',
  monotributo: 'Monotributo',
  exento: 'Exento',
  consumidor_final: 'Consumidor final',
  otro: 'Otro',
}

const inputStyle = {
  width: '100%',
  background: C.black,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 14px',
  color: C.white,
  fontSize: 14,
  boxSizing: 'border-box' as const,
}

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<CreateSupplierData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function load() {
    try {
      setLoading(true)
      setError('')
      setSuppliers(await supplierService.list())
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSaveError('')
    setShowForm(true)
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier)
    setForm({
      cuit: supplier.cuit ?? '',
      legalName: supplier.legalName ?? '',
      tradeName: supplier.tradeName ?? '',
      vatCondition: supplier.vatCondition ?? 'otro',
      address: supplier.address ?? '',
      contactName: supplier.contactName ?? '',
      contactEmail: supplier.contactEmail ?? '',
      contactPhone: supplier.contactPhone ?? '',
    })
    setSaveError('')
    setShowForm(true)
  }

  function update<K extends keyof CreateSupplierData>(key: K, value: CreateSupplierData[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function save() {
    if (!/^\d{11}$/.test(form.cuit) || !form.legalName.trim()) {
      setSaveError('Ingresá una razón social y un CUIT de 11 dígitos válido.')
      return
    }
    try {
      setSaving(true)
      setSaveError('')
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
      ) as unknown as CreateSupplierData
      if (editing) await supplierService.update(editing.id, payload)
      else await supplierService.create(payload)
      setShowForm(false)
      await load()
    } catch (cause: unknown) {
      setSaveError(cause instanceof Error ? cause.message : 'No se pudo guardar el proveedor')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(supplier: Supplier) {
    if (!window.confirm(`¿Desactivar a ${supplier.legalName ?? 'este proveedor'}?`)) return
    try {
      await supplierService.deactivate(supplier.id)
      await load()
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo desactivar el proveedor')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={T.pageHead}>Proveedores</div>
          <div style={T.pageSub}>Datos comerciales y de contacto del negocio</div>
        </div>
        <button style={T.btnPrimary} onClick={openCreate}>+ Nuevo proveedor</button>
      </div>

      {loading ? <p role="status" aria-live="polite" style={{ color: C.lime }}>Cargando proveedores...</p> : null}
      {error ? <p role="alert" style={{ color: C.red }}>{error}</p> : null}
      {!loading && !error && suppliers.length === 0 ? <p style={T.pageSub}>Aún no tenés proveedores cargados.</p> : null}

      {!loading && suppliers.length > 0 ? (
        <div style={{ ...T.card, overflowX: 'auto' }}>
          <table style={T.table}>
            <thead>
              <tr>{['Razón social', 'CUIT', 'Condición IVA', 'Contacto', 'Estado', 'Acciones'].map(label => <th key={label} style={T.th}>{label}</th>)}</tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td style={T.tdW}>{supplier.legalName ?? 'Proveedor histórico'}{supplier.tradeName ? <div style={{ ...T.pageSub, marginTop: 2 }}>{supplier.tradeName}</div> : null}</td>
                  <td style={T.td}>{supplier.cuit ?? 'Sin completar'}</td>
                  <td style={T.td}>{supplier.vatCondition ? VAT_LABELS[supplier.vatCondition] : 'Sin completar'}</td>
                  <td style={T.td}>{supplier.contactName || supplier.contactEmail || supplier.contactPhone || '—'}</td>
                  <td style={{ ...T.td, color: supplier.isActive ? C.lime : C.gray }}>{supplier.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td style={T.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={T.btnGhost} onClick={() => openEdit(supplier)}>Editar</button>
                      {supplier.isActive ? <button style={T.btnGhost} onClick={() => void deactivate(supplier)}>Desactivar</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showForm ? (
        <Modal title={editing ? 'Editar proveedor' : 'Nuevo proveedor'} width={700} onClose={() => setShowForm(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 14px' }}>
            <Input label="CUIT" value={form.cuit} maxLength={11} onChange={event => update('cuit', event.target.value.replace(/\D/g, ''))} />
            <Input label="Razón social" value={form.legalName} onChange={event => update('legalName', event.target.value)} />
            <Input label="Nombre de fantasía" value={form.tradeName} onChange={event => update('tradeName', event.target.value)} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: C.gray, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Condición IVA</label>
              <select style={inputStyle} value={form.vatCondition} onChange={event => update('vatCondition', event.target.value as SupplierVatCondition)}>
                {Object.entries(VAT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <Input label="Domicilio" value={form.address} onChange={event => update('address', event.target.value)} />
            <Input label="Persona de contacto" value={form.contactName} onChange={event => update('contactName', event.target.value)} />
            <Input label="Email" type="email" value={form.contactEmail} onChange={event => update('contactEmail', event.target.value)} />
            <Input label="Teléfono" value={form.contactPhone} onChange={event => update('contactPhone', event.target.value)} />
          </div>
          {saveError ? <p role="alert" style={{ color: C.red, fontSize: 13 }}>{saveError}</p> : null}
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...T.btnPrimary, flex: 1 }} disabled={saving} onClick={() => void save()}>{saving ? 'Guardando...' : 'Guardar proveedor'}</button>
            <button style={T.btnGhost} onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
