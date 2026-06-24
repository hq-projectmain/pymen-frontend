import { useState } from 'react';
import { authService } from '../services/authServices.ts';

interface RegisterViewProps {
    goToLogin: () => void;
}

export default function RegisterView({
                                         goToLogin,
                                     }: RegisterViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(
        e: React.FormEvent
    ) {
        e.preventDefault();

        try {
            setLoading(true);

            const { error } =
                await authService.register(
                    email,
                    password
                );

            if (error) {
                setMessage(error.message);
                return;
            }

            setMessage(
                'Cuenta creada correctamente.'
            );
        } catch (err: any) {
            setMessage(
                err.message ||
                'Error al crear la cuenta'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                maxWidth: 400,
                margin: '80px auto',
            }}
        >
            <h1>Registro</h1>

            <form onSubmit={handleRegister}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    placeholder="Email"
                />

                <br />
                <br />

                <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    placeholder="Password"
                />

                <br />
                <br />

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Creando cuenta...'
                        : 'Crear cuenta'}
                </button>
            </form>

            {message && (
                <p
                    style={{
                        marginTop: 12,
                    }}
                >
                    {message}
                </p>
            )}

            <div
                style={{
                    marginTop: 20,
                }}
            >
                <p>
                    ¿Ya tenés cuenta?
                </p>

                <button
                    type="button"
                    onClick={goToLogin}
                >
                    Iniciar sesión
                </button>
            </div>
        </div>
    );
}