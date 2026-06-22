import { BusinessProvider, useBusinessContext } from './context/BusinessContext'
import { Navbar } from './components/layout'
import { AdminView } from './app/AdminView'
import { BusinessView } from './app/BusinessView'
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
        {view === 'admin' ? <AdminView /> : <BusinessView />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  )
}
