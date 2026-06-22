import { useState } from 'react'
import { Modal } from '../../ui'
import { useBusinessContext } from '../../../context/BusinessContext'
import { useCurrentBusiness } from '../../../hooks/useBusinesses'
import { C, T } from '../../../styles/theme'

interface SaleItemForm {
  pid: string
  qty: string
}

export function SaleModal({ onClose }: { onClose: () => void }) {
  const biz = useCurrentBusiness()
  const { addSale } = useBusinessContext()
  const [items, setItems] = useState<SaleItemForm[]>([{ pid: '', qty: '1' }])

  if (!biz) return null

  const updateItem = (i: number, field: keyof SaleItemForm, value: string) =>
    setItems((s) => s.map((x, j) => (j === i ? { ...x, [field]: value } : x)))

  const removeItem = (i: number) =>
    setItems((s) => s.filter((_, j) => j !== i))

  const handleSave = () => {
    if (items.some((it) => !it.pid)) return
    addSale(items.map((it) => ({ pid: Number(it.pid), qty: Number(it.qty) })))
    onClose()
  }

  const inputStyle = {
    width: '100%',
    background: C.black,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: C.white,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <Modal title="Registrar venta" onClose={onClose}>
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.gray,
            marginBottom: 8,
            display: 'block',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Productos
        </label>

        {items.map((it, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: items.length > 1 ? '1fr 80px 32px' : '1fr 80px',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <select
              style={inputStyle}
              value={it.pid}
              onChange={(e) => updateItem(i, 'pid', e.target.value)}
            >
              <option value="">Elegir producto…</option>
              {biz.products
                .filter((p) => p.status)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>

            <input
              type="number"
              min="1"
              style={inputStyle}
              value={it.qty}
              onChange={(e) => updateItem(i, 'qty', e.target.value)}
            />

            {items.length > 1 && (
              <button
                style={{
                  background: 'rgba(255,59,48,0.1)',
                  color: C.red,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 700,
                }}
                onClick={() => removeItem(i)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          style={{ ...T.btnGhost, fontSize: 12, marginTop: 4 }}
          onClick={() => setItems((s) => [...s, { pid: '', qty: '1' }])}
        >
          + Agregar producto
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button style={{ ...T.btnRed, flex: 1, padding: '12px 18px' }} onClick={handleSave}>
          Registrar venta
        </button>
        <button style={{ ...T.btnGhost, padding: '12px 16px' }} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
