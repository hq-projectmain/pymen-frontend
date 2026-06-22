import { useBusinessContext } from '../../../context/BusinessContext'
import { useCurrentBusiness, saleTotal } from '../../../hooks/useBusinesses'
import { fmtMoney, fmtDate } from '../../../services/businessService'
import { C, T } from '../../../styles/theme'
import { Sale } from '../../../types'

interface SaleDetailProps {
  sale: Sale
}

export function SaleDetail({ sale }: SaleDetailProps) {
  const biz = useCurrentBusiness()
  const { setSaleDetail } = useBusinessContext()

  if (!biz) return null

  const total = saleTotal(sale, biz.products)

  return (
    <>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button style={T.btnGhost} onClick={() => setSaleDetail(null)}>
          ← Volver
        </button>
        <div>
          <div style={T.pageHead}>Detalle · {sale.id}</div>
          <div style={T.pageSub}>
            {biz.name} · {fmtDate(sale.date)}
          </div>
        </div>
      </div>

      {/* Tabla de ítems */}
      <div style={T.card}>
        <table style={T.table}>
          <thead>
            <tr>
              {['Producto', 'Precio unitario', 'Cantidad', 'Subtotal'].map((h) => (
                <th key={h} style={T.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sale.items.map((it, i) => {
              const p = biz.products.find((p) => p.id === it.pid)
              return (
                <tr key={i}>
                  <td style={T.tdW}>{p?.name ?? '—'}</td>
                  <td style={T.td}>{fmtMoney(p?.price ?? 0)}</td>
                  <td style={T.td}>{it.qty}</td>
                  <td style={{ ...T.td, color: C.lime, fontWeight: 600 }}>
                    {fmtMoney((p?.price ?? 0) * it.qty)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Total */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            marginTop: 8,
            paddingTop: 16,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 12,
                color: C.gray,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              Total
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.lime, letterSpacing: -1 }}>
              {fmtMoney(total)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
