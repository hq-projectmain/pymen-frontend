import { useEffect, useState } from 'react'
import { ApiError, arcaService, type ArcaConfig, type ArcaEnvironment } from '../../../services/arcaService'
import { userService, type UserProfile } from '../../../services/userService'
import { Input } from '../../ui/Input'
import { C, T } from '../../../styles/theme'

const emptyForm = {
  cuit: '',
  puntoVenta: 1,
  condicionIva: 'MONOTRIBUTO',
  environment: 'homologation' as ArcaEnvironment,
  businessName: '',
  fiscalAddress: '',
}

const selectStyle = {
  width: '100%',
  background: C.black,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 14px',
  color: C.white,
  fontSize: 14,
  boxSizing: 'border-box' as const,
}

export default function ArcaConfigView() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [config, setConfig] = useState<ArcaConfig | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const [profileResult, configResult] = await Promise.allSettled([
        userService.getProfile(),
        arcaService.getConfig(),
      ])
      if (!active) return

      if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
      else setError(profileResult.reason instanceof Error ? profileResult.reason.message : 'No se pudo cargar el perfil')

      if (configResult.status === 'fulfilled') {
        const value = configResult.value
        setConfig(value)
        setForm({
          cuit: value.cuit,
          puntoVenta: value.puntoVenta,
          condicionIva: value.condicionIva,
          environment: value.environment,
          businessName: value.businessName ?? '',
          fiscalAddress: value.fiscalAddress ?? '',
        })
      } else if (!(configResult.reason instanceof ApiError && configResult.reason.status === 422)) {
        setError(configResult.reason instanceof Error ? configResult.reason.message : 'No se pudo cargar la configuración fiscal')
      }
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [])

  const isAdmin = profile?.fiscalRole === 'admin'

  async function handleSave() {
    if (!/^\d{11}$/.test(form.cuit)) {
      setError('El CUIT debe tener exactamente 11 dígitos')
      return
    }

    try {
      setSaving(true)
      setError('')
      setNotice('')
      const saved = await arcaService.saveConfig(form)
      await arcaService.activate()
      setConfig(saved.data)
      setNotice('Configuración guardada y módulo ARCA activado. Falta validar el certificado con “Probar conexión”.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    try {
      setTesting(true)
      setError('')
      setNotice('')
      await arcaService.testConnection()
      setNotice('Conexión verificada: WSAA, WSFE y el punto de venta respondieron correctamente.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo validar la conexión con ARCA')
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <p style={{ color: C.lime }}>Cargando configuración fiscal...</p>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={T.pageHead}>Facturación ARCA</div>
        <div style={T.pageSub}>Configuración del emisor y validación del entorno fiscal</div>
      </div>

      {!isAdmin && (
        <div style={{ ...T.card, borderColor: 'rgba(255,59,48,.35)', marginBottom: 18, color: C.white }}>
          Tu cuenta no tiene el rol fiscal <strong>admin</strong>. Podés consultar esta sección, pero solo un administrador autorizado puede guardar credenciales o emitir comprobantes.
        </div>
      )}

      <div style={{ ...T.card, marginBottom: 18 }}>
        <div style={T.sectionTitle}>Datos fiscales del comercio</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 16px' }}>
          <Input label="CUIT emisor" inputMode="numeric" maxLength={11} value={form.cuit} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, cuit: event.target.value.replace(/\D/g, '') }))} />
          <Input label="Punto de venta" type="number" min={1} max={99998} value={form.puntoVenta} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, puntoVenta: Number(event.target.value) }))} />
          <Input label="Razón social" value={form.businessName} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, businessName: event.target.value }))} />
          <Input label="Domicilio fiscal" value={form.fiscalAddress} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, fiscalAddress: event.target.value }))} />
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.gray, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Condición IVA</label>
            <select style={selectStyle} value={form.condicionIva} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, condicionIva: event.target.value }))}>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable inscripto</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.gray, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Ambiente</label>
            <select style={selectStyle} value={form.environment} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, environment: event.target.value as ArcaEnvironment }))}>
              <option value="homologation">Homologación (pruebas)</option>
              <option value="production">Producción (comprobantes reales)</option>
            </select>
          </div>
        </div>

        {form.environment === 'production' && (
          <p style={{ color: C.red, fontSize: 13 }}>Atención: en producción, una emisión autorizada genera un comprobante fiscal real.</p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          <button style={T.btnPrimary} disabled={!isAdmin || saving} onClick={handleSave}>
            {saving ? 'Guardando...' : 'Guardar y activar ARCA'}
          </button>
          <button style={T.btnLime} disabled={!isAdmin || testing || !config} onClick={handleTest}>
            {testing ? 'Validando...' : 'Probar conexión'}
          </button>
        </div>
      </div>

      <div style={T.card}>
        <div style={T.sectionTitle}>Certificado del comercio</div>
        <p style={{ ...T.pageSub, lineHeight: 1.6 }}>
          El certificado y la clave privada no se cargan en el navegador. Deben instalarse como secretos protegidos en el servidor Render para este CUIT y ambiente.
        </p>
        {config?.expectedSecretLocation && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: C.black, color: C.lime, fontFamily: 'monospace', fontSize: 12, overflowWrap: 'anywhere' }}>
            {config.expectedSecretLocation}
          </div>
        )}
      </div>

      {notice && <p role="status" style={{ color: C.lime, marginTop: 16 }}>{notice}</p>}
      {error && <p role="alert" style={{ color: C.red, marginTop: 16 }}>{error}</p>}
    </div>
  )
}
