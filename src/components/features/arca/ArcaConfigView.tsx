import { useEffect, useState } from 'react'
import {
  ApiError,
  arcaService,
  type ArcaConfig,
  type ArcaCredentialStatus,
  type ArcaEnvironment,
} from '../../../services/arcaService'
import { userService, type UserProfile } from '../../../services/userService'
import { Input } from '../../ui/Input'
import { C, T } from '../../../styles/theme'

interface ArcaConfigViewProps {
  profile?: UserProfile
}

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

const fileStyle = {
  ...selectStyle,
  padding: '9px 12px',
}

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: C.gray,
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase' as const,
}

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleDateString('es-AR')
  : '—'

export default function ArcaConfigView({ profile: suppliedProfile }: ArcaConfigViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(suppliedProfile ?? null)
  const [config, setConfig] = useState<ArcaConfig | null>(null)
  const [credentials, setCredentials] = useState<ArcaCredentialStatus | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [fileInputVersion, setFileInputVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const [profileResult, configResult] = await Promise.allSettled([
        suppliedProfile ? Promise.resolve(suppliedProfile) : userService.getProfile(),
        arcaService.getConfig(),
      ])
      if (!active) return

      if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
      else setError(profileResult.reason instanceof Error ? profileResult.reason.message : 'No se pudo cargar el perfil')

      if (configResult.status === 'fulfilled') {
        const value = configResult.value
        setConfig(value)
        setCredentials(value.credentials ?? null)
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
  }, [suppliedProfile])

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
      setCredentials(saved.data.credentials ?? null)
      setNotice('Datos fiscales guardados. Ahora cargá el certificado y la clave del mismo CUIT y ambiente.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  async function handleCredentialUpload() {
    if (!config) {
      setError('Primero guardá los datos fiscales del comercio')
      return
    }
    if (!certificateFile || !privateKeyFile) {
      setError('Seleccioná el certificado y la clave privada')
      return
    }
    if (certificateFile.size > 65_536 || privateKeyFile.size > 65_536) {
      setError('Cada archivo debe pesar como máximo 64 KB')
      return
    }

    try {
      setUploading(true)
      setError('')
      setNotice('')
      const [certificatePem, privateKeyPem] = await Promise.all([
        certificateFile.text(),
        privateKeyFile.text(),
      ])
      const result = await arcaService.saveCredentials(certificatePem, privateKeyPem)
      setCredentials(result.credentials)
      setCertificateFile(null)
      setPrivateKeyFile(null)
      setFileInputVersion(value => value + 1)
      setNotice('Certificado y clave validados, cifrados y asociados a este comercio.')
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar las credenciales')
    } finally {
      setUploading(false)
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
      <div style={{ marginBottom: 18 }}>
        <div style={T.pageHead}>Conexión con ARCA</div>
        <div style={T.pageSub}>Configuración única del comercio para emitir desde cada venta</div>
      </div>

      {!isAdmin && (
        <div style={{ ...T.card, borderColor: 'rgba(255,59,48,.35)', marginBottom: 18, color: C.white }}>
          Tu cuenta no tiene el rol fiscal <strong>admin</strong>. Solo un administrador autorizado puede cambiar credenciales o emitir comprobantes.
        </div>
      )}

      <div style={{ ...T.card, marginBottom: 16 }}>
        <div style={T.sectionTitle}>1. Datos fiscales del comercio</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 14px' }}>
          <Input label="CUIT emisor" inputMode="numeric" maxLength={11} value={form.cuit} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, cuit: event.target.value.replace(/\D/g, '') }))} />
          <Input label="Punto de venta" type="number" min={1} max={99998} value={form.puntoVenta} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, puntoVenta: Number(event.target.value) }))} />
          <Input label="Razón social" value={form.businessName} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, businessName: event.target.value }))} />
          <Input label="Domicilio fiscal" value={form.fiscalAddress} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, fiscalAddress: event.target.value }))} />
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Condición IVA</label>
            <select style={selectStyle} value={form.condicionIva} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, condicionIva: event.target.value }))}>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable inscripto</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Ambiente</label>
            <select style={selectStyle} value={form.environment} disabled={!isAdmin} onChange={event => setForm(current => ({ ...current, environment: event.target.value as ArcaEnvironment }))}>
              <option value="homologation">Homologación (pruebas)</option>
              <option value="production">Producción (comprobantes reales)</option>
            </select>
          </div>
        </div>

        {form.environment === 'production' && (
          <p style={{ color: C.red, fontSize: 13 }}>Atención: una emisión autorizada en producción genera un comprobante fiscal real.</p>
        )}

        <button style={T.btnPrimary} disabled={!isAdmin || saving} onClick={handleSave}>
          {saving ? 'Guardando...' : 'Guardar datos y activar ARCA'}
        </button>
      </div>

      <div style={{ ...T.card, marginBottom: 16 }}>
        <div style={T.sectionTitle}>2. Certificado y clave privada</div>
        <p style={{ ...T.pageSub, lineHeight: 1.6, marginBottom: 14 }}>
          Seleccioná los archivos PEM obtenidos siguiendo la guía. Se transmiten por HTTPS, se validan en el backend y se guardan cifrados; nunca se vuelven a mostrar ni descargar.
        </p>

        {credentials?.configured ? (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(204,255,0,.07)', border: `1px solid ${C.borderLime}`, marginBottom: 14 }}>
            <strong style={{ color: C.lime }}>Credenciales configuradas</strong>
            <div style={{ ...T.pageSub, lineHeight: 1.7 }}>
              Almacenamiento: {credentials.source === 'encrypted_database' ? 'cifrado y persistente' : 'archivo protegido del servidor'}<br />
              Vencimiento: {formatDate(credentials.validTo)}
              {credentials.fingerprint && <><br />Huella: …{credentials.fingerprint.slice(-12)}</>}
            </div>
          </div>
        ) : (
          <p style={{ color: C.gray, fontSize: 13 }}>Todavía no hay credenciales configuradas para este CUIT y ambiente.</p>
        )}

        <div key={fileInputVersion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Certificado (.pem/.crt)</label>
            <input style={fileStyle} type="file" accept=".pem,.crt,.cer" disabled={!isAdmin || !config} onChange={event => setCertificateFile(event.target.files?.[0] ?? null)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Clave privada (.key/.pem)</label>
            <input style={fileStyle} type="file" accept=".key,.pem" disabled={!isAdmin || !config} onChange={event => setPrivateKeyFile(event.target.files?.[0] ?? null)} />
          </div>
        </div>

        <button style={T.btnPrimary} disabled={!isAdmin || !config || uploading} onClick={handleCredentialUpload}>
          {uploading ? 'Validando y cifrando...' : credentials?.configured ? 'Reemplazar credenciales' : 'Guardar credenciales de forma segura'}
        </button>

        {!credentials?.configured && config?.expectedSecretLocation && (
          <details style={{ marginTop: 14, color: C.gray, fontSize: 12 }}>
            <summary>Alternativa para administración manual del servidor</summary>
            <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: C.black, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
              {config.expectedSecretLocation}
            </div>
          </details>
        )}
      </div>

      <div style={T.card}>
        <div style={T.sectionTitle}>3. Validar conexión</div>
        <p style={{ ...T.pageSub, lineHeight: 1.6 }}>
          Verifica el certificado, la autenticación WSAA, el servicio WSFE y que el punto de venta esté habilitado.
        </p>
        <button style={T.btnLime} disabled={!isAdmin || testing || !config || !credentials?.configured} onClick={handleTest}>
          {testing ? 'Validando...' : 'Probar conexión con ARCA'}
        </button>
      </div>

      {notice && <p role="status" style={{ color: C.lime, marginTop: 16 }}>{notice}</p>}
      {error && <p role="alert" style={{ color: C.red, marginTop: 16 }}>{error}</p>}
    </div>
  )
}
