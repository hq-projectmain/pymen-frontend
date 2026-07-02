import { useState } from 'react'
import { SaleDetail } from './SaleDetail'
import { SaleModal } from './SaleModal'
import { useBusinessContext } from '../../../context/BusinessContext'
import { useCurrentBusiness, saleTotal } from '../../../hooks/useBusinesses'
import { fmtMoney, fmtDate } from '../../../services/businessService'
import { C, T } from '../../../styles/theme'

export function SalesView() {
  const biz = useCurrentBusiness()
  const { saleDetail, setSaleDetail } = useBusinessContext()
  const [hovered,   setHovered]   = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (!biz) return null

  // Muestra el detalle si hay una venta seleccionada
  if (saleDetail) return <SaleDetail sale={saleDetail} />

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
          <div style={T.pageHead}>Ventas</div>
          <div style={T.pageSub}>Hacé clic en una fila para ver el detalle</div>
        </div>
        <button style={T.btnRed} onClick={() => setShowModal(true)}>
          + Registrar venta
        </button>
      </div>

      {/* Tabla */}
      <div style={T.card}>
        <table style={T.table}>
          <thead>
            <tr>
              {['ID Venta', 'Total', 'Fecha'].map((h) => (
                <th key={h} style={T.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...biz.sales].reverse().map((s) => (
              <tr
                key={s.id}
                style={{
                  background: hovered === s.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background .1s',
                }}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSaleDetail(s)}
              >
                <td style={T.tdW}>{s.id}</td>
                <td style={{ ...T.tdW, color: C.lime }}>
                  {fmtMoney(saleTotal(s, biz.products))}
                </td>
                <td style={T.td}>{fmtDate(s.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <SaleModal onClose={() => setShowModal(false)} />}
    </>
  )
}
