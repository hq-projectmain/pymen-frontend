import { useCallback, useEffect, useState } from 'react'
import { Input } from '../../ui/Input'
import { userService, type PendingInvitation, type TeamMember } from '../../../services/userService'
import { C, T } from '../../../styles/theme'

export default function TeamView({ canManage = false }: { canManage?: boolean }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reload = useCallback(async () => {
    const [team, pending] = await Promise.all([userService.getTeam(), canManage ? userService.getPendingInvitations() : Promise.resolve([])])
    setMembers(team); setInvitations(pending)
  }, [canManage])
  useEffect(() => { reload().catch(cause => setError(cause instanceof Error ? cause.message : 'No se pudo cargar el equipo')).finally(() => setLoading(false)) }, [reload])

  async function invite(event: React.FormEvent) {
    event.preventDefault(); setError(''); setNotice('')
    try {
      const result = await userService.createInvitation(email.trim().toLowerCase(), 'employee')
      const token = result.registrationToken
      const link = token ? `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(token)}&role=employee&email=${encodeURIComponent(email.trim().toLowerCase())}` : ''
      if (link) await navigator.clipboard.writeText(link)
      setNotice(link ? 'Invitación creada y enlace copiado. El token solo se muestra esta vez.' : result.message)
      setEmail(''); await reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo invitar') }
  }

  async function update(member: TeamMember, operation: 'status' | 'fiscal' | 'discount', value: boolean | string | number) {
    setError('')
    try {
      if (operation === 'status') await userService.updateTeamStatus(member.id, Boolean(value))
      if (operation === 'fiscal') await userService.updateFiscalRole(member.id, value as 'none' | 'operator')
      if (operation === 'discount') await userService.updateSalesPermissions(member.id, Number(value))
      await reload()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar') }
  }

  return <div>
    <div style={{ marginBottom: 18 }}><div style={T.pageHead}>Equipo</div><div style={T.pageSub}>{canManage ? 'Administrá accesos, facturación y descuentos.' : 'Compañeros con acceso al negocio.'}</div></div>
    {canManage ? <form onSubmit={invite} style={{ ...T.card, marginBottom: 18 }}><div style={T.sectionTitle}>Invitar empleado</div><div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}><div style={{ flex: 1 }}><Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div><button style={{ ...T.btnPrimary, marginBottom: 16 }}>Crear enlace</button></div></form> : null}
    {canManage && invitations.length ? <div style={{ ...T.card, marginBottom: 18 }}><div style={T.sectionTitle}>Invitaciones pendientes</div>{invitations.map(invite => <div key={invite.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8 }}><span>{invite.invitedEmail} · vence {new Date(invite.expiresAt).toLocaleDateString('es-AR')}</span><button style={T.btnGhost} onClick={() => userService.revokeInvitation(invite.id).then(reload)}>Revocar</button></div>)}</div> : null}
    <div style={T.card}><div style={T.sectionTitle}>Personas con acceso</div>{loading ? <p>Cargando...</p> : <div style={{ overflowX: 'auto' }}><table style={T.table}><thead><tr>{['Nombre', ...(canManage ? ['Email'] : []), 'Rol', 'Estado', ...(canManage ? ['Facturación', 'Descuento máximo', 'Acción'] : [])].map(x => <th key={x} style={T.th}>{x}</th>)}</tr></thead><tbody>{members.map(member => <tr key={member.id}><td style={T.tdW}>{member.name}</td>{canManage ? <td style={T.td}>{member.email}</td> : null}<td style={T.td}>{member.systemRole === 'owner' ? 'Dueño' : 'Empleado'}</td><td style={T.td}>{member.isActive ? 'Activo' : 'Inactivo'}</td>{canManage ? <><td style={T.td}><select value={member.fiscalRole ?? 'none'} onChange={e => update(member, 'fiscal', e.target.value)} disabled={member.systemRole !== 'employee'}><option value="none">No</option><option value="operator">Sí</option></select></td><td style={T.td}><input type="number" min="0" max="100" defaultValue={member.maxDiscountPercent ?? 0} onBlur={e => update(member, 'discount', e.target.value)} disabled={member.systemRole !== 'employee'} style={{ width: 65 }} />%</td><td style={T.td}>{member.systemRole === 'employee' ? <button style={T.btnGhost} onClick={() => update(member, 'status', !member.isActive)}>{member.isActive ? 'Desactivar' : 'Reactivar'}</button> : '—'}</td></> : null}</tr>)}</tbody></table></div>}</div>
    {notice ? <p style={{ color: C.lime }}>{notice}</p> : null}{error ? <p role="alert" style={{ color: C.red }}>{error}</p> : null}
  </div>
}
