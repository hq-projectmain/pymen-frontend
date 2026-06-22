import { C } from '../../styles/theme'

interface BadgeProps {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}

export function Badge({
  active,
  activeLabel = 'Activo',
  inactiveLabel = 'Inactivo',
}: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        background: active ? 'rgba(204,255,0,0.1)' : 'rgba(255,59,48,0.1)',
        color: active ? C.lime : C.red,
        border: `1px solid ${active ? 'rgba(204,255,0,0.2)' : 'rgba(255,59,48,0.2)'}`,
      }}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}
