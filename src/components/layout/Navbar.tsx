import { C } from '../../styles/theme'
import { useBusinessContext } from '../../context/BusinessContext'
import { BusinessTab } from '../../types'
import {authService} from "@/services/authServices.ts";
import { Button } from '../ui';

const TABS: { key: BusinessTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products',  label: 'Productos' },
  { key: 'sales',     label: 'Ventas'    },
]

export function Navbar() {
  const { view, bizTab, setBizTab, setSaleDetail, exitBiz } = useBusinessContext()
  const isAdmin = view === 'admin'

  return (
      <nav
          style={{
              background: C.graphite,
              borderBottom: `1px solid ${C.border}`,
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
              position: 'sticky',
              top: 0,
              zIndex: 10,
          }}
      >
          {/* Logo */}
          <span style={{fontSize: 20, fontWeight: 900, letterSpacing: -1, color: C.white}}>
        py<span style={{color: C.red}}>men</span>{' '}
              <span style={{fontSize: 11, color: C.gray, fontWeight: 500, letterSpacing: 1}}>
          ERP
        </span>
      </span>

          {/* Centro: badge admin o tabs de negocio */}
          {isAdmin ? (
              <span
                  style={{
                      fontSize: 12,
                      color: C.lime,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                  }}
              >
          ● Vista Global Admin
        </span>
          ) : (
              <div style={{display: 'flex', gap: 4}}>
                  {TABS.map((t) => (
                      <button
                          key={t.key}
                          style={{
                              background: bizTab === t.key ? C.red : 'transparent',
                              color: bizTab === t.key ? C.white : C.gray,
                              border: 'none',
                              padding: '7px 16px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                              transition: 'all .15s',
                          }}
                          onClick={() => {
                              setBizTab(t.key)
                              setSaleDetail(null)
                          }}
                      >
                          {t.label}
                      </button>
                  ))}
              </div>
          )}

          {/* Derecha: botón volver */}
          <div style={{minWidth: 120, display: 'flex', justifyContent: 'flex-end'}}>
              {!isAdmin && (
                  <Button
                      variant="ghost"
                      onClick={exitBiz}
                  >
                      ← Panel Admin
                  </Button>
              )}
          </div>
          <Button
              variant="red"
              onClick={() => authService.logout()}
          >
              Cerrar sesión
          </Button>
      </nav>
  )
}
