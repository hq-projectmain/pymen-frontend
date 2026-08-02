import { useState } from 'react'
import { Button, Input } from '../components/ui'
import { authService } from '../services/authServices'
import { userService, type SystemRole } from '../services/userService'
import { C, T } from '../styles/theme'

interface RegisterViewProps { goToLogin: () => void }
const roleLabels: Record<SystemRole, string> = { owner: 'Dueño del negocio', employee: 'Empleado', platform_admin: 'Administrador de Pymen' }

export default function RegisterView({ goToLogin }: RegisterViewProps) {
  const params = new URLSearchParams(window.location.search)
  const initialToken = params.get('invite') ?? ''
  const requestedRole = params.get('role') as SystemRole | null
  const invitedRole = requestedRole === 'employee' || requestedRole === 'platform_admin' ? requestedRole : 'employee'
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [role, setRole] = useState<SystemRole>(initialToken ? invitedRole : 'owner')
  const [invitationToken, setInvitationToken] = useState(initialToken)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true); setMessage(''); setIsError(false)
      const normalizedEmail = email.trim().toLowerCase()
      const validation = await userService.validateRegistration({
        email: normalizedEmail,
        systemRole: role,
        invitationToken: role !== 'owner' ? invitationToken.trim() : undefined,
      })
      if (!(validation.eligible ?? validation.valid)) throw new Error(validation.message || 'Este registro no está habilitado.')
      const { data, error } = await authService.register(normalizedEmail, password, name.trim(), role, role !== 'owner' ? invitationToken.trim() : undefined, role === 'owner' ? businessName.trim() : undefined)
      if (error) throw error
      if (!data.user?.id) throw new Error('No se pudo obtener el ID del usuario')
      setMessage('Cuenta creada correctamente. Revisá tu email para confirmar.')
    } catch (cause: unknown) {
      setIsError(true); setMessage(cause instanceof Error ? cause.message : 'Error al crear la cuenta')
    } finally { setLoading(false) }
  }

  const incomplete = !name.trim() || !email.trim() || !password || (role === 'owner' && !businessName.trim()) || (role !== 'owner' && !invitationToken.trim())
  return <div style={{ minHeight: '100vh', background: C.black, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
    <div style={{ ...T.card, width: 440, maxWidth: '100%' }}>
      <h1 style={T.pageHead}>Crear cuenta</h1><p style={T.pageSub}>Creá tu acceso a Pymen</p>
      <form onSubmit={handleRegister} style={{ marginTop: 24 }}>
        <label htmlFor="system-role" style={{ fontSize: 12, fontWeight: 600, color: C.gray, display: 'block', marginBottom: 6 }}>Tipo de usuario</label>
        <select id="system-role" value={role} disabled={Boolean(initialToken)} onChange={event => setRole(event.target.value as SystemRole)} style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, marginBottom: 16 }}>
          {(Object.entries(roleLabels) as Array<[SystemRole, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Input label="Nombre y apellido" value={name} onChange={event => setName(event.target.value)} required />
        {role === 'owner' ? <Input label="Nombre del negocio" value={businessName} onChange={event => setBusinessName(event.target.value)} required /> : null}
        {role !== 'owner' ? <Input label="Token de invitación" value={invitationToken} onChange={event => setInvitationToken(event.target.value)} required /> : null}
        <Input label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
        <Input label="Contraseña" type="password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required />
        {message ? <p role={isError ? 'alert' : 'status'} style={{ color: isError ? C.red : C.lime, fontSize: 13 }}>{message}</p> : null}
        <Button type="submit" variant="lime" fullWidth disabled={loading || incomplete}>{loading ? 'Validando y creando...' : 'Crear cuenta'}</Button>
      </form>
      <div style={{ marginTop: 24, textAlign: 'center' }}><Button type="button" variant="ghost" onClick={goToLogin}>Iniciar sesión</Button></div>
    </div>
  </div>
}
