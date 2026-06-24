import { useState } from 'react';
import { authService } from '../services/authServices.ts';

interface LoginViewProps {
    goToRegister: () => void;
}

export default function LoginView({
                                      goToRegister,
                                  }: LoginViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(
        e: React.FormEvent
    ) {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            const { error } =
                await authService.login(
                    email,
                    password
                );

            if (error) throw error;

        } catch (err: any) {
            setError(err.message);
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
            <h1>Login</h1>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                />

                <br />
                <br />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <br />
                <br />

                {error && (
                    <p style={{ color: 'red' }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? 'Ingresando...'
                        : 'Ingresar'}
                </button>
            </form>

            <div
                style={{
                    marginTop: 20,
                }}
            >
                <p>
                    ¿No tenés cuenta?
                </p>

                <button
                    type="button"
                    onClick={goToRegister}
                >
                    Crear cuenta
                </button>
            </div>
        </div>
    );
}