import { useCallback, useEffect, useState } from 'react'
import { Input } from '../components/ui/Input'
import {
  userService,
  type AdminBusiness,
  type AdminBusinessDetail,
} from '../services/userService'
import { C, T } from '../styles/theme'

const moneyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})

const fmtMoney = (value: number) => moneyFormatter.format(Number(value || 0))
const fmtDate = (value: string) => value
  ? new Date(value).toLocaleDateString('es-AR')
  : '—'
const fmtDateTime = (value: string) => value
  ? new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
  : '—'
const fmtCalendarDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : '—'
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div style={T.statCard}>
      <div style={{ fontSize: 12, color: C.gray, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: C.white, marginTop: 8 }}>{value}</div>
      {hint ? <div style={{ color: C.gray, fontSize: 12, marginTop: 6 }}>{hint}</div> : null}
    </div>
  )
}

type AccessRange = 'daily' | 'weekly' | 'monthly'

const accessRangeLabel: Record<AccessRange, string> = {
  daily: 'Día',
  weekly: 'Semana',
  monthly: 'Mes',
}

function AccessChart({ points, label }: { points: Array<{ period: string; count: number }>; label: string }) {
  const width = 720
  const height = 190
  const padding = 24
  const max = Math.max(1, ...points.map(point => point.count))
  const coordinates = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : padding + (index * (width - padding * 2)) / (points.length - 1)
    const y = height - padding - (point.count / max) * (height - padding * 2)
    return { ...point, x, y }
  })

  return (
    <div>
      <svg role="img" aria-label={`Accesos agrupados por ${label.toLowerCase()}`} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minHeight: 160, display: 'block' }}>
        <title>{`Accesos por ${label.toLowerCase()}`}</title>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={C.border} />
        <polyline fill="none" stroke={C.lime} strokeWidth="3" points={coordinates.map(point => `${point.x},${point.y}`).join(' ')} />
        {coordinates.map(point => (
          <g key={point.period}>
            <circle cx={point.x} cy={point.y} r="4" fill={C.lime}>
              <title>{`${point.period}: ${point.count} accesos`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: C.gray, fontSize: 11 }}>
        <span>{points[0]?.period ?? '—'}</span>
        <span>{points[points.length - 1]?.period ?? '—'}</span>
      </div>
    </div>
  )
}

function BusinessDetailView({
  business,
  detail,
  loading,
  error,
  onBack,
  onRetry,
}: {
  business: AdminBusiness
  detail: AdminBusinessDetail | null
  loading: boolean
  error: string
  onBack: () => void
  onRetry: () => void
}) {
  const [accessRange, setAccessRange] = useState<AccessRange>('daily')
  const movementLabel: Record<string, string> = {
    sale: 'Venta',
    product_created: 'Producto creado',
    product_updated: 'Producto actualizado',
    product_deactivated: 'Producto desactivado',
    stock_purchase: 'Ingreso / compra de stock',
    stock_adjustment: 'Ajuste manual de stock',
  }
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button type="button" style={T.btnGhost} onClick={onBack}>← Volver a negocios</button>
        <div style={{ minWidth: 0 }}>
          <div style={T.pageHead}>{business.businessName || business.ownerName}</div>
          <div style={T.pageSub}>Detalle operativo separado de este comercio</div>
        </div>
      </div>

      {loading ? <p role="status" style={{ color: C.lime }}>Cargando detalle del negocio...</p> : null}
      {error ? (
        <div style={{ ...T.card, borderColor: C.red }}>
          <p role="alert" style={{ color: C.red, marginTop: 0 }}>{error}</p>
          <button type="button" style={T.btnPrimary} onClick={onRetry}>Reintentar</button>
        </div>
      ) : null}

      {!loading && !error && detail ? (
        <>
          <section style={{ ...T.card, marginBottom: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={T.sectionTitle}>Identidad del negocio</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.white }}>{detail.identity.businessName}</div>
                <div style={{ color: C.gray, marginTop: 6 }}>{detail.identity.ownerName} · {detail.identity.ownerEmail}</div>
                <div style={{ color: C.gray, fontSize: 12, marginTop: 6 }}>Registrado el {fmtDate(detail.identity.createdAt)}</div>
              </div>
              <div style={{ alignSelf: 'flex-start', border: `1px solid ${detail.identity.isActive ? C.borderLime : C.border}`, borderRadius: 999, padding: '7px 12px', color: detail.identity.isActive ? C.lime : C.gray, fontWeight: 700 }}>
                {detail.identity.isActive ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          </section>

          <section aria-label="Métricas principales" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
            <MetricCard label="Empleados" value={detail.employees.total} hint={`${detail.employees.active} activos · ${detail.employees.inactive} inactivos`} />
            <MetricCard label="Productos" value={detail.products.total} hint={`${detail.products.active} activos · ${detail.products.inactive} inactivos`} />
            <MetricCard label="Stock total" value={detail.products.totalStock} hint={`${detail.products.lowStock} con stock ≤ ${detail.products.lowStockThreshold}`} />
            <MetricCard label="Ventas" value={detail.sales.count} hint={`${detail.sales.withCae} con CAE · ${detail.sales.withoutCae} sin CAE`} />
            <MetricCard label="Ingresos" value={fmtMoney(detail.sales.totalRevenue)} />
            <MetricCard label="Ticket promedio" value={fmtMoney(detail.sales.averageTicket)} />
          </section>

          <section style={{ ...T.card, marginBottom: 20 }}>
            <div style={T.sectionTitle}>Actividad diaria reciente</div>
            <div style={{ ...T.pageSub, marginBottom: 14 }}>Últimos 14 días con ventas registradas</div>
            {detail.dailyActivity.length === 0 ? <p style={T.pageSub}>No hubo ventas en este período.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 }}>
                {detail.dailyActivity.map(day => (
                  <div key={day.date} style={{ background: C.black, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                    <div style={{ color: C.gray, fontSize: 12 }}>{fmtCalendarDate(day.date)}</div>
                    <div style={{ color: C.white, fontSize: 20, fontWeight: 800, marginTop: 5 }}>{day.saleCount} ventas</div>
                    <div style={{ color: C.lime, fontSize: 13, marginTop: 3 }}>{fmtMoney(day.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 20 }}>
            <section style={T.card}>
              <div style={T.sectionTitle}>Productos destacados</div>
              {detail.topProducts.length === 0 ? <p style={T.pageSub}>Todavía no hay productos vendidos.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={T.table}>
                    <thead><tr><th style={T.th}>Producto</th><th style={T.th}>Unidades</th><th style={T.th}>Ingresos</th></tr></thead>
                    <tbody>{detail.topProducts.map(product => (
                      <tr key={product.productId}>
                        <td style={T.tdW}>{product.name}</td>
                        <td style={T.td}>{product.quantity}</td>
                        <td style={{ ...T.td, color: C.lime }}>{fmtMoney(product.revenue)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section style={T.card}>
              <div style={T.sectionTitle}>Ventas recientes</div>
              {detail.recentSales.length === 0 ? <p style={T.pageSub}>Todavía no hay ventas registradas.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={T.table}>
                    <thead><tr><th style={T.th}>Venta</th><th style={T.th}>Total</th><th style={T.th}>Estado fiscal</th><th style={T.th}>Fecha</th></tr></thead>
                    <tbody>{detail.recentSales.map(sale => (
                      <tr key={sale.id}>
                        <td style={T.tdW}>{sale.id.slice(0, 8)}…<br /><span style={{ color: C.gray, fontSize: 11 }}>{sale.unitCount} unidades</span></td>
                        <td style={T.td}>{fmtMoney(sale.totalPrice)}</td>
                        <td style={{ ...T.td, color: sale.hasCae ? C.lime : C.gray }}>{sale.hasCae ? 'Con CAE' : 'Sin CAE'}</td>
                        <td style={T.td}>{fmtDateTime(sale.createdAt)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section style={{ ...T.card, marginTop: 20 }}>
            <div style={T.sectionTitle}>Movimientos operativos recientes</div>
            <div style={{ ...T.pageSub, marginBottom: 14 }}>Los movimientos conservan el actor real y el nombre del producto al momento de la operación.</div>
            {detail.movements.length === 0 ? <p style={T.pageSub}>Aún no hay movimientos recopilados.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={T.table}>
                  <thead><tr>{['Tipo', 'Producto / detalle', 'Actor', 'Cantidad', 'Monto', 'Fecha'].map(value => <th key={value} style={T.th}>{value}</th>)}</tr></thead>
                  <tbody>{detail.movements.map(movement => (
                    <tr key={movement.id}>
                      <td style={T.tdW}>{movementLabel[movement.kind] ?? movement.kind}</td>
                      <td style={T.td}>{movement.productName || movement.description}</td>
                      <td style={T.td}>{movement.actor.name}<br /><span style={{ color: C.gray, fontSize: 11 }}>{movement.actor.systemRole === 'owner' ? 'Dueño' : 'Empleado'} · {movement.actor.email}</span></td>
                      <td style={T.td}>{movement.quantity == null ? '—' : movement.quantity}</td>
                      <td style={T.td}>{movement.amount == null ? '—' : fmtMoney(movement.amount)}</td>
                      <td style={T.td}>{fmtDateTime(movement.createdAt)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section style={{ ...T.card, marginTop: 20 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={T.sectionTitle}>Accesos al negocio</div>
                <div style={T.pageSub}>Este mes: {detail.accessStats.monthSummary.accesses} accesos de {detail.accessStats.monthSummary.activeUsers} usuarios</div>
              </div>
              <div role="group" aria-label="Agrupar accesos" style={{ display: 'flex', gap: 6 }}>
                {(Object.keys(accessRangeLabel) as AccessRange[]).map(range => (
                  <button key={range} type="button" aria-pressed={accessRange === range} style={accessRange === range ? T.btnPrimary : T.btnGhost} onClick={() => setAccessRange(range)}>{accessRangeLabel[range]}</button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <AccessChart points={detail.accessStats[accessRange]} label={accessRangeLabel[accessRange]} />
            </div>
            <p style={{ color: C.gray, fontSize: 12, borderLeft: `3px solid ${C.borderLime}`, paddingLeft: 10 }}>{detail.accessStats.collectionNotice}</p>

            <div style={{ ...T.sectionTitle, marginTop: 22 }}>Accesos por usuario</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={T.table}>
                <thead><tr><th style={T.th}>Usuario</th><th style={T.th}>Rol</th><th style={T.th}>Accesos este mes</th><th style={T.th}>Último acceso histórico</th></tr></thead>
                <tbody>{detail.accessStats.byUser.map(member => (
                  <tr key={member.userId}>
                    <td style={T.tdW}>{member.name}<br /><span style={{ color: C.gray, fontSize: 11 }}>{member.email}</span></td>
                    <td style={T.td}>{member.systemRole === 'owner' ? 'Dueño' : 'Empleado'}</td>
                    <td style={T.td}>{member.monthAccesses}</td>
                    <td style={T.td}>{member.lastAccessAt ? fmtDateTime(member.lastAccessAt) : 'Sin accesos recopilados'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

export function AdminView() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusiness | null>(null)
  const [detail, setDetail] = useState<AdminBusinessDetail | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [listError, setListError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [notice, setNotice] = useState('')

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true)
      setListError('')
      setBusinesses(await userService.getAdminBusinesses())
    } catch (cause: unknown) {
      setListError(cause instanceof Error ? cause.message : 'No se pudieron cargar los negocios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadBusinesses() }, [loadBusinesses])

  async function loadDetail(business: AdminBusiness) {
    try {
      setSelectedBusiness(business)
      setDetail(null)
      setDetailLoading(true)
      setDetailError('')
      setDetail(await userService.getAdminBusinessDetail(business.ownerId))
    } catch (cause: unknown) {
      setDetailError(cause instanceof Error ? cause.message : 'No se pudo cargar el detalle del negocio')
    } finally {
      setDetailLoading(false)
    }
  }

  async function inviteAdmin(event: React.FormEvent) {
    event.preventDefault()
    try {
      setInviting(true)
      setInviteError('')
      setNotice('')
      const result = await userService.createInvitation(inviteEmail.trim().toLowerCase(), 'platform_admin')
      setNotice(result.message || 'Invitación de administrador creada.')
      setInviteEmail('')
    } catch (cause: unknown) {
      setInviteError(cause instanceof Error ? cause.message : 'No se pudo crear la invitación')
    } finally {
      setInviting(false)
    }
  }

  if (selectedBusiness) {
    return (
      <BusinessDetailView
        business={selectedBusiness}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        onBack={() => { setSelectedBusiness(null); setDetail(null); setDetailError('') }}
        onRetry={() => { void loadDetail(selectedBusiness) }}
      />
    )
  }

  const totalRevenue = businesses.reduce((total, business) => total + Number(business.totalRevenue || 0), 0)
  const totalEmployees = businesses.reduce((total, business) => total + Number(business.employeeCount || 0), 0)

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={T.pageHead}>Administración de Pymen</div>
        <div style={T.pageSub}>Cada comercio se muestra por separado. No se exponen CUIT, certificados ni credenciales fiscales.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
        <MetricCard label="Negocios" value={businesses.length} />
        <MetricCard label="Empleados" value={totalEmployees} />
        <MetricCard label="Ventas globales" value={businesses.reduce((total, business) => total + Number(business.saleCount || 0), 0)} />
        <MetricCard label="Facturación global" value={fmtMoney(totalRevenue)} />
      </div>

      <div style={{ ...T.card, marginBottom: 20 }}>
        <div style={T.sectionTitle}>Invitar administrador</div>
        <form onSubmit={inviteAdmin} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, maxWidth: 560 }}>
          <div style={{ flex: '1 1 260px' }}><Input label="Email" type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} required /></div>
          <button style={{ ...T.btnPrimary, marginBottom: 16 }} disabled={inviting || !inviteEmail.trim()}>{inviting ? 'Creando...' : 'Crear invitación'}</button>
        </form>
        {notice ? <p role="status" style={{ color: C.lime }}>{notice}</p> : null}
        {inviteError ? <p role="alert" style={{ color: C.red }}>{inviteError}</p> : null}
      </div>

      <section>
        <div style={{ ...T.sectionTitle, marginBottom: 12 }}>Negocios registrados</div>
        {loading ? <p role="status" style={{ color: C.lime }}>Cargando negocios...</p> : null}
        {listError ? (
          <div style={{ ...T.card, borderColor: C.red }}>
            <p role="alert" style={{ color: C.red, marginTop: 0 }}>{listError}</p>
            <button type="button" style={T.btnPrimary} onClick={() => { void loadBusinesses() }}>Reintentar</button>
          </div>
        ) : null}
        {!loading && !listError && businesses.length === 0 ? <p style={T.pageSub}>No hay negocios registrados.</p> : null}
        {!loading && !listError && businesses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
            {businesses.map(business => (
              <button
                key={business.ownerId}
                type="button"
                onClick={() => { void loadDetail(business) }}
                style={{ ...T.card, textAlign: 'left', cursor: 'pointer', width: '100%', color: C.white, font: 'inherit' }}
                aria-label={`Ver detalle de ${business.businessName || business.ownerName}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: C.white, fontSize: 18, fontWeight: 800, overflowWrap: 'anywhere' }}>{business.businessName || business.ownerName}</div>
                    <div style={{ color: C.gray, fontSize: 13, marginTop: 5 }}>{business.ownerName}</div>
                    <div style={{ color: C.gray, fontSize: 12, overflowWrap: 'anywhere' }}>{business.ownerEmail}</div>
                  </div>
                  <span style={{ color: business.isActive ? C.lime : C.gray, fontSize: 12, fontWeight: 700 }}>{business.isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
                  <div><div style={{ color: C.gray, fontSize: 11 }}>Equipo</div><strong>{business.employeeCount}</strong></div>
                  <div><div style={{ color: C.gray, fontSize: 11 }}>Productos</div><strong>{business.productCount}</strong></div>
                  <div><div style={{ color: C.gray, fontSize: 11 }}>Ventas</div><strong>{business.saleCount}</strong></div>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong style={{ color: C.lime }}>{fmtMoney(business.totalRevenue)}</strong>
                  <span style={{ color: C.gray, fontSize: 12 }}>Ver detalle →</span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </>
  )
}
