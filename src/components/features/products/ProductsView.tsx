import { useState } from 'react'
import { Badge } from '../../ui'
import { ProductModal } from './ProductModal'
import { useBusinessContext } from '../../../context/BusinessContext'
import { useCurrentBusiness } from '../../../hooks/useBusinesses'
import { C, T } from '../../../styles/theme'
import { fmtMoney } from '../../../services/businessService'
import { Product } from '../../../types'

export function ProductsView() {
  const biz = useCurrentBusiness()
  const { toggleProduct } = useBusinessContext()

  const [hovered,    setHovered]    = useState<number | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)

  if (!biz) return null

  const openNew  = () => { setEditTarget(null);  setShowModal(true) }
  const openEdit = (p: Product) => { setEditTarget(p); setShowModal(true) }

  return (
    <>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={T.pageHead}>Productos</div>
          <div style={T.pageSub}>
            {biz.products.length} productos · {biz.name}
          </div>
        </div>
        <button style={T.btnRed} onClick={openNew}>
          + Nuevo producto
        </button>
      </div>

      {/* Tabla */}
      <div style={T.card}>
        <table style={T.table}>
          <thead>
            <tr>
              {['Nombre', 'Descripción', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => (
                <th key={h} style={T.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {biz.products.map((p) => (
              <tr
                key={p.id}
                style={{
                  background: hovered === p.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <td style={T.tdW}>{p.name}</td>
                <td style={T.td}>{p.desc}</td>
                <td style={{ ...T.td, color: C.lime, fontWeight: 600 }}>
                  {fmtMoney(p.price)}
                </td>
                <td
                  style={{
                    ...T.td,
                    color:      p.stock === 0 ? C.red   : C.white,
                    fontWeight: p.stock === 0 ? 700     : 400,
                  }}
                >
                  {p.stock}
                </td>
                <td style={T.td}>
                  <Badge active={p.status} />
                </td>
                <td style={T.td}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={T.btnLime} onClick={() => openEdit(p)}>
                      Editar
                    </button>
                    <button style={T.btnGhost} onClick={() => toggleProduct(p.id)}>
                      {p.status ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductModal editTarget={editTarget} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
