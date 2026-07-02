import { InputHTMLAttributes } from 'react'
import { C } from '../../styles/theme'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: C.gray,
            marginBottom: 6,
            display: 'block',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          background: C.black,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '10px 14px',
          color: C.white,
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        {...props}
      />
    </div>
  )
}
