import { useState } from 'react'
import { Badge } from '../components/ui'
import { useBusinessContext } from '../context/BusinessContext'
import { useAdminStats } from '../hooks/useBusinesses'
import { fmtMoney, fmtDate, bizRevenue } from '../services/businessService'
import { C, T } from '../styles/theme'

export function AdminView() {
  const { businesses, enterBiz, toggleBiz } = useBusinessContext()
  const stats = useAdminStats()
  const [hovered, setHovered] = useState<number | null>(null)

  const statCards = [
    { label: 'Negocios',          val: stats.total,                    sub: `${stats.active} activos`    },
    { label: 'Productos totales', val: stats.totalProducts,            sub: 'en la plataforma'           },
    { label: 'Facturación global',val: fmtMoney(stats.totalRevenue),   sub: 'acumulada'                  },
  ]

  return (
    <>
      {/* Encabezado */}
      <div style={{ marginBottom: 20 }}>
        <div style={T.pageHead}>Panel de Administración</div>
        <div style={{ ...T.pageSub, marginBottom: 0 }}>
          {businesses.length} negocios registrados en la plataforma
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
        {statCards.map((s) => (
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

      {/* Tabla de negocios */}
      <div style={T.card}>
        <div style={T.sectionTitle}>Negocios registrados</div>
        <table style={T.table}>
          <thead>
            <tr>
              {['Negocio', 'Email', 'Estado', 'Productos', 'Ventas', 'Registro', 'Acciones'].map(
                (h) => <th key={h} style={T.th}>{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <tr
                key={b.id}
                style={{
                  background: hovered === b.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={() => setHovered(b.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <td style={T.tdW}>{b.name}</td>
                <td style={T.td}>{b.email}</td>
                <td style={T.td}><Badge active={b.status} /></td>
                <td style={T.td}>{b.products.length}</td>
                <td style={T.td}>{b.sales.length}</td>
                <td style={T.td}>{fmtDate(b.createdAt)}</td>
                <td style={T.td}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={T.btnLime} onClick={() => enterBiz(b)}>
                      Ver detalle
                    </button>
                    <button style={T.btnGhost} onClick={() => toggleBiz(b.id)}>
                      {b.status ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
