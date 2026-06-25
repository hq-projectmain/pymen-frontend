import { useState, useEffect, useRef } from 'react'
import { useAuth } from './context/AuthContext'
import LoginView from './app/LoginView'
import RegisterView from './app/RegisterView'
import DashboardView from './components/features/dashboard/DashboardView'
import ProductsListView from './components/features/products/ProductsListView'
import SalesListView from './components/features/sales/SalesListView'
import { authService } from './services/authServices'
import { userService, UserProfile } from './services/userService'
import { Modal } from './components/ui/Modal'
import { Input } from './components/ui/Input'
import { C, T } from './styles/theme'

type Tab = 'dashboard' | 'products' | 'sales'

const TABS: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard'  },
    { key: 'products',  label: 'Productos'  },
    { key: 'sales',     label: 'Ventas'     },
]

function ProfileDropdown() {
    const [open, setOpen]           = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [profile, setProfile]     = useState<UserProfile | null>(null)
    const [name, setName]           = useState('')
    const [saving, setSaving]       = useState(false)
    const [saveError, setSaveError] = useState('')
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    async function openProfile() {
        setOpen(false)
        setSaveError('')
        try {
            const data = await userService.getProfile()
            setProfile(data)
            setName(data.name)
            setShowModal(true)
        } catch {
            alert('No se pudo cargar el perfil')
        }
    }

    async function handleSave() {
        if (!name.trim()) return
        try {
            setSaving(true)
            setSaveError('')
            await userService.updateProfile({ name })
            setShowModal(false)
        } catch (err: any) {
            setSaveError(err.message || 'Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div ref={ref} style={{ position: 'relative' }}>
                <button
                    onClick={() => setOpen(v => !v)}
                    style={{ background: 'transparent', color: C.gray, border: `1px solid ${C.border}`, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    Mi cuenta <span style={{ fontSize: 10 }}>▾</span>
                </button>

                {open && (
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#1F232B', border: `1px solid ${C.border}`, borderRadius: 10, minWidth: 160, zIndex: 100, overflow: 'hidden' }}>
                        <button
                            onClick={openProfile}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: C.white, padding: '11px 16px', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                        >
                            Mi perfil
                        </button>
                        <div style={{ height: 1, background: C.border }} />
                        <button
                            onClick={() => authService.logout()}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: C.red, padding: '11px 16px', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                        >
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </div>

            {showModal && profile && (
                <Modal title="Mi perfil" onClose={() => setShowModal(false)}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: C.gray, display: 'block', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Email</label>
                        <div style={{ background: C.black, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.gray, fontSize: 14 }}>
                            {profile.email}
                        </div>
                    </div>

                    <Input
                        label="Nombre del comercio"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />

                    {saveError && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{saveError}</p>}

                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                        <button style={{ ...T.btnPrimary, flex: 1, padding: '12px 18px' }} onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button style={{ ...T.btnGhost, padding: '12px 16px' }} onClick={() => setShowModal(false)}>Cancelar</button>
                    </div>
                </Modal>
            )}
        </>
    )
}

function MainApp() {
    const [tab, setTab] = useState<Tab>('dashboard')

    return (
        <div style={{ background: C.black, minHeight: '100vh', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column' }}>

            {/* Navbar */}
            <nav style={{ background: '#1F232B', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, position: 'sticky', top: 0, zIndex: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -1, color: '#fff' }}>
                    py<span style={{ color: '#FF3B30' }}>men</span>{' '}
                    <span style={{ fontSize: 11, color: '#A0A8B8', fontWeight: 500, letterSpacing: 1 }}>ERP</span>
                </span>

                <div style={{ display: 'flex', gap: 4 }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{ background: 'transparent', color: tab === t.key ? '#fff' : '#A0A8B8', border: tab === t.key ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid transparent', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, transition: 'all .15s' }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <ProfileDropdown />
            </nav>

            {/* Contenido */}
            <main style={{ flex: 1, padding: 28, maxWidth: 1200, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
                {tab === 'dashboard' && <DashboardView />}
                {tab === 'products'  && <ProductsListView />}
                {tab === 'sales'     && <SalesListView />}
            </main>
        </div>
    )
}

function ProtectedApp() {
    const { user, loading } = useAuth()
    const [authView, setAuthView] = useState<'login' | 'register'>('login')

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: C.black, color: '#fff' }}>
                Cargando...
            </div>
        )
    }

    if (!user) {
        return authView === 'login'
            ? <LoginView goToRegister={() => setAuthView('register')} />
            : <RegisterView goToLogin={() => setAuthView('login')} />
    }

    return <MainApp />
}

export default function App() {
    return <ProtectedApp />
}
