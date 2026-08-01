import { useEffect, useState } from 'react'
import { Input } from '../components/ui/Input'
import { userService, type AdminBusiness } from '../services/userService'
import { C, T } from '../styles/theme'

const fmtMoney = (value: number) => `$${Number(value || 0).toLocaleString('es-AR')}`
const fmtDate = (value: string) => value ? new Date(value).toLocaleDateString('es-AR') : '—'

export function AdminView() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    userService.getAdminBusinesses()
      .then(data => { if (active) setBusinesses(data) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los negocios') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function inviteAdmin(event: React.FormEvent) {
    event.preventDefault()
    try {
      setInviting(true)
      setError('')
      setNotice('')
      const result = await userService.createInvitation(inviteEmail.trim().toLowerCase(), 'platform_admin')
      setNotice(result.message || 'Invitación de administrador creada.')
      setInviteEmail('')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la invitación')
    } finally {
      setInviting(false)
    }
  }

  const totalRevenue = businesses.reduce((total, business) => total + Number(business.totalRevenue || 0), 0)
  const totalEmployees = businesses.reduce((total, business) => total + Number(business.employeeCount || 0), 0)

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={T.pageHead}>Administración de Pymen</div>
        <div style={T.pageSub}>Vista global de los comercios. Los certificados y datos fiscales sensibles no se muestran.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          ['Negocios', businesses.length],
          ['Empleados', totalEmployees],
          ['Ventas globales', businesses.reduce((total, business) => total + Number(business.saleCount || 0), 0)],
          ['Facturación global', fmtMoney(totalRevenue)],
        ].map(([label, value]) => (
          <div key={label} style={T.statCard}>
            <div style={{ fontSize: 12, color: C.gray, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.white, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...T.card, marginBottom: 20 }}>
        <div style={T.sectionTitle}>Invitar administrador</div>
        <form onSubmit={inviteAdmin} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, maxWidth: 560 }}>
          <div style={{ flex: 1 }}><Input label="Email" type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} required /></div>
          <button style={{ ...T.btnPrimary, marginBottom: 16 }} disabled={inviting || !inviteEmail.trim()}>{inviting ? 'Creando...' : 'Crear invitación'}</button>
        </form>
        {notice ? <p role="status" style={{ color: C.lime }}>{notice}</p> : null}
        {error ? <p role="alert" style={{ color: C.red }}>{error}</p> : null}
      </div>

      <div style={T.card}>
        <div style={T.sectionTitle}>Negocios registrados</div>
        {loading ? <p style={{ color: C.lime }}>Cargando negocios...</p> : businesses.length === 0 ? (
          <p style={T.pageSub}>No hay negocios registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={T.table}>
              <thead><tr>{['Negocio', 'Dueño', 'Estado', 'Equipo', 'Productos', 'Ventas', 'Facturación', 'Registro'].map(label => <th key={label} style={T.th}>{label}</th>)}</tr></thead>
              <tbody>{businesses.map(business => (
                <tr key={business.ownerId}>
                  <td style={T.tdW}>{business.businessName}</td>
                  <td style={T.td}>{business.ownerName}<br /><span style={{ color: C.gray, fontSize: 12 }}>{business.ownerEmail}</span></td>
                  <td style={T.td}>{business.isActive ? 'Activo' : 'Inactivo'}</td>
                  <td style={T.td}>{business.employeeCount}</td>
                  <td style={T.td}>{business.productCount}</td>
                  <td style={T.td}>{business.saleCount}</td>
                  <td style={T.td}>{fmtMoney(business.totalRevenue)}</td>
                  <td style={T.td}>{fmtDate(business.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
