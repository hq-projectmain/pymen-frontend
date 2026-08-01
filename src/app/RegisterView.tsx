import { useState } from 'react'
import { Button, Input } from '../components/ui'
import { authService } from '../services/authServices'
import { userService, type SystemRole } from '../services/userService'
import { C, T } from '../styles/theme'

interface RegisterViewProps {
  goToLogin: () => void
}

const roleLabels: Record<SystemRole, string> = {
  owner: 'Dueño del negocio',
  employee: 'Empleado',
  platform_admin: 'Administrador de Pymen',
}

export default function RegisterView({ goToLogin }: RegisterViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [role, setRole] = useState<SystemRole>('owner')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()
    try {
      setLoading(true)
      setMessage('')
      setIsError(false)

      const normalizedEmail = email.trim().toLowerCase()
      const normalizedOwnerEmail = ownerEmail.trim().toLowerCase()
      const validation = await userService.validateRegistration({
        email: normalizedEmail,
        systemRole: role,
        ownerEmail: role === 'employee' ? normalizedOwnerEmail : undefined,
      })
      if (!(validation.eligible ?? validation.valid)) {
        setIsError(true)
        setMessage(validation.message || 'Este registro no está habilitado.')
        return
      }

      const { data, error } = await authService.register(
        normalizedEmail,
        password,
        name.trim(),
        role,
        role === 'employee' ? normalizedOwnerEmail : undefined,
        role === 'owner' ? businessName.trim() : undefined,
      )
      if (error) throw error
      if (!data.user?.id) throw new Error('No se pudo obtener el ID del usuario')
      setMessage('Cuenta creada correctamente. Revisá tu email para confirmar.')
    } catch (cause: unknown) {
      setIsError(true)
      setMessage(cause instanceof Error ? cause.message : 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  const isIncomplete = !name.trim() || !email.trim() || !password ||
    (role === 'owner' && !businessName.trim()) ||
    (role === 'employee' && !ownerEmail.trim())

  return (
    <div style={{ minHeight: '100vh', background: C.black, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ ...T.card, width: 440, maxWidth: '100%' }}>
        <h1 style={T.pageHead}>Crear cuenta</h1>
        <p style={T.pageSub}>Creá tu acceso a Pymen</p>

        <form onSubmit={handleRegister} style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="system-role" style={{ fontSize: 12, fontWeight: 600, color: C.gray, display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tipo de usuario</label>
            <select
              id="system-role"
              value={role}
              onChange={event => { setRole(event.target.value as SystemRole); setMessage('') }}
              style={{ width: '100%', background: C.black, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.white, fontSize: 14 }}
            >
              {(Object.entries(roleLabels) as Array<[SystemRole, string]>).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <Input label="Nombre y apellido" value={name} onChange={event => setName(event.target.value)} placeholder="Ej: Ana López" required />

          {role === 'owner' ? (
            <Input label="Nombre del negocio" value={businessName} onChange={event => setBusinessName(event.target.value)} placeholder="Ej: Kiosco El Centro" required />
          ) : null}

          {role === 'employee' ? (
            <Input label="Email del dueño del negocio" type="email" value={ownerEmail} onChange={event => setOwnerEmail(event.target.value)} placeholder="dueno@negocio.com" required />
          ) : null}

          {role === 'platform_admin' ? (
            <p style={{ ...T.pageSub, lineHeight: 1.5, marginBottom: 16 }}>Las cuentas administradoras solo pueden registrarse con una invitación previa de Pymen.</p>
          ) : null}

          <Input label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" required />
          <Input label="Contraseña" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Contraseña" minLength={8} required />

          {message ? <p role={isError ? 'alert' : 'status'} style={{ color: isError ? C.red : C.lime, fontSize: 13, marginBottom: 16 }}>{message}</p> : null}

          <Button type="submit" variant="lime" fullWidth disabled={loading || isIncomplete}>
            {loading ? 'Validando y creando...' : 'Crear cuenta'}
          </Button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={T.pageSub}>¿Ya tenés cuenta?</p>
          <Button type="button" variant="ghost" onClick={goToLogin}>Iniciar sesión</Button>
        </div>
      </div>
    </div>
  )
}
