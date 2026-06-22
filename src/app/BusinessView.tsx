import { useBusinessContext } from '../context/BusinessContext'
import { useCurrentBusiness, saleTotal } from '../hooks/useBusinesses'
import { fmtDate, fmtMoney, bizRevenue } from '../services/businessService'
import { ProductsView } from '../components/features/products'
import { SalesView } from '../components/features/sales'
import { C, T } from '../styles/theme'

export function BusinessView() {
  const biz = useCurrentBusiness()
  const { bizTab } = useBusinessContext()

  if (!biz) return null

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 8, fontSize: 12, color: C.gray2, fontWeight: 600 }}>
        Panel Admin /{' '}
        <span style={{ color: C.lime }}>{biz.name}</span>
      </div>

      {/* ── Dashboard ─────────────────────────────────────────────────────────── */}
      {bizTab === 'dashboard' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={T.pageHead}>{biz.name}</div>
            <div style={{ ...T.pageSub, marginBottom: 0 }}>
              {biz.email} · cliente desde {fmtDate(biz.createdAt)}
            </div>
          </div>

          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: 'Productos',
                val: biz.products.length,
                sub: `${biz.products.filter((p) => p.status).length} activos`,
              },
              { label: 'Ventas',       val: biz.sales.length,          sub: 'registradas' },
              { label: 'Facturación',  val: fmtMoney(bizRevenue(biz)), sub: 'total'       },
            ].map((s) => (
              <div key={s.label} style={T.statCard}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: C.gray,
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -2, color: C.white }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 12, color: C.lime, marginTop: 4, fontWeight: 600 }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Ventas recientes */}
          <div style={T.card}>
            <div style={T.sectionTitle}>Ventas recientes</div>
            <table style={T.table}>
              <thead>
                <tr>
                  {['ID', 'Total', 'Fecha'].map((h) => (
                    <th key={h} style={T.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...biz.sales].reverse().slice(0, 5).map((s) => (
                  <tr key={s.id}>
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
        </>
      )}

      {/* ── Productos ─────────────────────────────────────────────────────────── */}
      {bizTab === 'products' && <ProductsView />}

      {/* ── Ventas ────────────────────────────────────────────────────────────── */}
      {bizTab === 'sales' && <SalesView />}
    </>
  )
}
