import { useEffect, useState } from 'react'
import { Input } from '../../ui/Input'
import { userService, type TeamMember } from '../../../services/userService'
import { C, T } from '../../../styles/theme'

export default function TeamView() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    userService.getTeam()
      .then(data => { if (active) setMembers(data) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el equipo') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function inviteEmployee(event: React.FormEvent) {
    event.preventDefault()
    try {
      setInviting(true)
      setError('')
      setNotice('')
      const result = await userService.createInvitation(email.trim().toLowerCase(), 'employee')
      setNotice(result.message || 'Empleado habilitado para registrarse.')
      setEmail('')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la invitación')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={T.pageHead}>Equipo</div>
        <div style={T.pageSub}>Invitá empleados para operar productos, ventas y facturación sin exponer la configuración sensible.</div>
      </div>

      <form onSubmit={inviteEmployee} style={{ ...T.card, marginBottom: 18 }}>
        <div style={T.sectionTitle}>Invitar empleado</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1 }}><Input label="Email del empleado" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
          <button style={{ ...T.btnPrimary, marginBottom: 16 }} disabled={inviting || !email.trim()}>{inviting ? 'Creando...' : 'Crear invitación'}</button>
        </div>
        {notice ? <p role="status" style={{ color: C.lime }}>{notice}</p> : null}
        {error ? <p role="alert" style={{ color: C.red }}>{error}</p> : null}
      </form>

      <div style={T.card}>
        <div style={T.sectionTitle}>Personas con acceso</div>
        {loading ? <p style={{ color: C.lime }}>Cargando equipo...</p> : members.length === 0 ? <p style={T.pageSub}>Todavía no hay empleados registrados.</p> : (
          <table style={T.table}>
            <thead><tr>{['Nombre', 'Email', 'Rol', 'Estado', 'Alta'].map(label => <th key={label} style={T.th}>{label}</th>)}</tr></thead>
            <tbody>{members.map(member => <tr key={member.id}>
              <td style={T.tdW}>{member.name}</td>
              <td style={T.td}>{member.email}</td>
              <td style={T.td}>{member.systemRole === 'owner' ? 'Dueño' : 'Empleado'}</td>
              <td style={T.td}>{member.isActive ? 'Activo' : 'Inactivo'}</td>
              <td style={T.td}>{new Date(member.createdAt).toLocaleDateString('es-AR')}</td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
