import { ButtonHTMLAttributes } from 'react';
import { T } from '../../styles/theme';

type ButtonVariant =
    | 'lime'
    | 'ghost'
    | 'red';

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
}

export function Button({
                           variant = 'ghost',
                           fullWidth = false,
                           style,
                           children,
                           ...props
                       }: ButtonProps) {
    const baseStyle =
        variant === 'lime'
            ? T.btnLime
            : variant === 'red'
                ? T.btnRed
                : T.btnGhost;

    return (
        <button
            {...props}
            style={{
                ...baseStyle,
                ...(fullWidth
                    ? {
                        width: '100%',
                        padding: '12px',
                    }
                    : {}),
                ...style,
            }}
        >
            {children}
        </button>
    );
}