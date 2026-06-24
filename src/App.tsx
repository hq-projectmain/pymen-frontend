import { useState } from 'react'

import {
    BusinessProvider,
    useBusinessContext,
} from './context/BusinessContext'

import { useAuth } from './context/AuthContext'

import { Navbar } from './components/layout'

import { AdminView } from './app/AdminView'
import { BusinessView } from './app/BusinessView'

import LoginView from './app/LoginView'
import RegisterView from './app/RegisterView'

import { C } from './styles/theme'

function AppContent() {
    const { view } = useBusinessContext()

    return (
        <div
            style={{
                background: C.black,
                minHeight: '100vh',
                color: C.white,
                fontFamily: "'Inter', system-ui, sans-serif",
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Navbar />

            <main
                style={{
                    flex: 1,
                    padding: 28,
                    maxWidth: 1200,
                    width: '100%',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                }}
            >
                {view === 'admin'
                    ? <AdminView />
                    : <BusinessView />}
            </main>
        </div>
    )
}

function ProtectedApp() {
    const { user, loading } = useAuth()

    const [authView, setAuthView] = useState<
        'login' | 'register'
    >('login')

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                Cargando...
            </div>
        )
    }

    if (!user) {
        return authView === 'login' ? (
            <LoginView
                goToRegister={() =>
                    setAuthView('register')
                }
            />
        ) : (
            <RegisterView
                goToLogin={() =>
                    setAuthView('login')
                }
            />
        )
    }

    return (
        <BusinessProvider>
            <AppContent />
        </BusinessProvider>
    )
}

export default function App() {
    return <ProtectedApp />
}