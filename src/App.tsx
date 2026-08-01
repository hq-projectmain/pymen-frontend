import { useEffect, useRef, useState } from 'react'
import LoginView from './app/LoginView'
import RegisterView from './app/RegisterView'
import { AdminView } from './app/AdminView'
import ArcaConfigView from './components/features/arca/ArcaConfigView'
import DashboardView from './components/features/dashboard/DashboardView'
import ProductsListView from './components/features/products/ProductsListView'
import PurchasesView from './components/features/purchases/PurchasesView'
import SalesListView from './components/features/sales/SalesListView'
import SuppliersView from './components/features/suppliers/SuppliersView'
import TeamView from './components/features/team/TeamView'
import { Input } from './components/ui/Input'
import { Modal } from './components/ui/Modal'
import { useAuth } from './context/AuthContext'
import { authService } from './services/authServices'
import { userService, type UserProfile } from './services/userService'
import { C, T } from './styles/theme'

type Tab = 'dashboard' | 'products' | 'sales' | 'suppliers' | 'purchases'
type ProfileTab = 'profile' | 'arca' | 'team'

const TABS: { key: Tab; label: string; ownerOnly?: boolean }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Productos' },
  { key: 'sales', label: 'Ventas' },
  { key: 'suppliers', label: 'Proveedores', ownerOnly: true },
  { key: 'purchases', label: 'Compras', ownerOnly: true },
]

const roleLabel = {
  platform_admin: 'Administrador de Pymen',
  owner: 'Dueño del negocio',
  employee: 'Empleado',
}

function ProfileDropdown({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState(profile.name)
  const [businessName, setBusinessName] = useState(profile.businessName ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [profileTab, setProfileTab] = useState<ProfileTab>('profile')
  const ref = useRef<HTMLDivElement>(null)
  const isOwner = profile.systemRole === 'owner'

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!profile || profile.systemRole === 'platform_admin') return
    void userService.recordSessionAccess().catch(() => undefined)
  }, [profile])

  function openProfile(tab: ProfileTab) {
    setOpen(false)
    setSaveError('')
    setProfileTab(tab)
    setName(profile.name)
    setBusinessName(profile.businessName ?? '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!name.trim() || (isOwner && !businessName.trim())) return
    try {
      setSaving(true)
      setSaveError('')
      await userService.updateProfile({
        name: name.trim(),
        businessName: isOwner ? businessName.trim() : undefined,
      })
      setShowModal(false)
    } catch (cause: unknown) {
      setSaveError(cause instanceof Error ? cause.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(value => !value)} aria-expanded={open} style={{ background: 'transparent', color: C.gray, border: `1px solid ${C.border}`, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Mi cuenta ▾
        </button>
        {open ? (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#1F232B', border: `1px solid ${C.border}`, borderRadius: 10, minWidth: 180, zIndex: 100, overflow: 'hidden' }}>
            <button onClick={() => openProfile('profile')} style={{ width: '100%', background: 'transparent', border: 'none', color: C.white, padding: '11px 16px', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>Mi perfil</button>
            {isOwner ? <button onClick={() => openProfile('team')} style={{ width: '100%', background: 'transparent', border: 'none', borderTop: `1px solid ${C.border}`, color: C.white, padding: '11px 16px', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>Equipo</button> : null}
            {isOwner ? <button onClick={() => openProfile('arca')} style={{ width: '100%', background: 'transparent', border: 'none', borderTop: `1px solid ${C.border}`, color: C.lime, padding: '11px 16px', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>ARCA</button> : null}
            <button onClick={() => authService.logout()} style={{ width: '100%', background: 'transparent', border: 'none', borderTop: `1px solid ${C.border}`, color: C.red, padding: '11px 16px', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}>Cerrar sesión</button>
          </div>
        ) : null}
      </div>

      {showModal ? (
        <Modal title="Mi cuenta" width={profileTab === 'profile' ? 520 : 900} onClose={() => setShowModal(false)}>
          {isOwner ? (
            <div role="tablist" aria-label="Secciones de la cuenta" style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, marginBottom: 20 }}>
              <button role="tab" aria-selected={profileTab === 'profile'} style={profileTab === 'profile' ? T.btnPrimary : T.btnGhost} onClick={() => setProfileTab('profile')}>Mi perfil</button>
              <button role="tab" aria-selected={profileTab === 'team'} style={profileTab === 'team' ? T.btnPrimary : T.btnGhost} onClick={() => setProfileTab('team')}>Equipo</button>
              <button role="tab" aria-selected={profileTab === 'arca'} style={profileTab === 'arca' ? T.btnPrimary : T.btnGhost} onClick={() => setProfileTab('arca')}>ARCA</button>
            </div>
          ) : null}

          {profileTab === 'arca' && isOwner ? <ArcaConfigView profile={profile} /> : null}
          {profileTab === 'team' && isOwner ? <TeamView /> : null}
          {profileTab === 'profile' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 6, textTransform: 'uppercase' }}>Email</div>
                <div style={{ background: C.black, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.gray, fontSize: 14 }}>{profile.email}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.gray, marginBottom: 6, textTransform: 'uppercase' }}>Rol</div>
                <div style={{ color: C.white }}>{roleLabel[profile.systemRole]}</div>
              </div>
              <Input label="Nombre y apellido" value={name} onChange={event => setName(event.target.value)} />
              {isOwner ? <Input label="Nombre del negocio" value={businessName} onChange={event => setBusinessName(event.target.value)} /> : null}
              {saveError ? <p role="alert" style={{ color: C.red, fontSize: 13 }}>{saveError}</p> : null}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ ...T.btnPrimary, flex: 1 }} onClick={handleSave} disabled={saving || !name.trim() || (isOwner && !businessName.trim())}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
                <button style={T.btnGhost} onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </>
          ) : null}
        </Modal>
      ) : null}
    </>
  )
}

function AppShell({ profile }: { profile: UserProfile }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const isPlatformAdmin = profile.systemRole === 'platform_admin'
  const isOwner = profile.systemRole === 'owner'
  const visibleTabs = TABS.filter(item => !item.ownerOnly || isOwner)

  return (
    <div style={{ background: C.black, minHeight: '100vh', color: C.white, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#1F232B', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, position: 'sticky', top: 0, zIndex: 10, gap: 12 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: C.white }}>py<span style={{ color: C.red }}>men</span> <span style={{ fontSize: 11, color: C.gray, fontWeight: 500 }}>ERP</span></span>
        {!isPlatformAdmin ? (
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '8px 0' }}>{visibleTabs.map(item => <button key={item.key} onClick={() => setTab(item.key)} style={{ background: 'transparent', color: tab === item.key ? C.white : C.gray, border: tab === item.key ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid transparent', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>{item.label}</button>)}</div>
        ) : <strong style={{ color: C.gray, fontSize: 13 }}>Panel global</strong>}
        <ProfileDropdown profile={profile} />
      </nav>
      <main style={{ flex: 1, padding: 28, maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {isPlatformAdmin ? <AdminView /> : null}
        {!isPlatformAdmin && tab === 'dashboard' ? <DashboardView /> : null}
        {!isPlatformAdmin && tab === 'products' ? <ProductsListView /> : null}
        {!isPlatformAdmin && tab === 'sales' ? <SalesListView /> : null}
        {isOwner && tab === 'suppliers' ? <SuppliersView /> : null}
        {isOwner && tab === 'purchases' ? <PurchasesView /> : null}
      </main>
    </div>
  )
}

function AuthenticatedApp() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    userService.getProfile()
      .then(value => { if (active) setProfile(value) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el perfil') })
    return () => { active = false }
  }, [])

  if (error) return <div style={{ minHeight: '100vh', background: C.black, color: C.red, display: 'grid', placeItems: 'center' }}><div><p>{error}</p><button style={T.btnGhost} onClick={() => authService.logout()}>Cerrar sesión</button></div></div>
  if (!profile) return <div style={{ minHeight: '100vh', background: C.black, color: C.white, display: 'grid', placeItems: 'center' }}>Cargando perfil...</div>
  return <AppShell profile={profile} />
}

function ProtectedApp() {
  const { user, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.black, color: C.white }}>Cargando...</div>
  if (!user) return authView === 'login' ? <LoginView goToRegister={() => setAuthView('register')} /> : <RegisterView goToLogin={() => setAuthView('login')} />
  return <AuthenticatedApp />
}

export default function App() {
  return <ProtectedApp />
}
