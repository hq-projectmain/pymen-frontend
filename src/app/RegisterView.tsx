import { useState } from 'react';
import { authService } from '../services/authServices';
import {Button, Input} from '../components/ui';
import { C, T } from '../styles/theme';

const BASE_URL = 'http://localhost:3000/pymen';

interface RegisterViewProps {
    goToLogin: () => void;
}

export default function RegisterView({
                                         goToLogin,
                                     }: RegisterViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(
        e: React.FormEvent
    ) {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage('');

            const { data, error } =
                await authService.register(
                    email,
                    password
                );

            if (error) {
                setMessage(error.message);
                return;
            }

            const userId = data.user?.id;
            if (!userId) {
                setMessage('Error al obtener el ID del usuario');
                return;
            }

            const backendRes = await fetch(`${BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, email, name }),
            });

            if (!backendRes.ok) {
                const err = await backendRes.json().catch(() => ({}));
                setMessage(err.message || 'Cuenta creada pero error al registrar el comercio');
                return;
            }

            setMessage('Cuenta creada correctamente. Revisá tu email para confirmar.');
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
                minHeight: '100vh',
                background: C.black,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 24,
            }}
        >
            <div
                style={{
                    ...T.card,
                    width: 420,
                    maxWidth: '100%',
                }}
            >
                <h1 style={T.pageHead}>
                    Crear cuenta
                </h1>

                <p style={T.pageSub}>
                    Registrá tu comercio en Pymen
                </p>

                <form
                    onSubmit={handleRegister}
                    style={{
                        marginTop: 24,
                    }}
                >
                    <Input
                        label="Nombre del comercio"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Ferretería López"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        placeholder="Email"
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Contraseña"
                    />

                    {message && (
                        <p
                            style={{
                                color: message.includes('Error')
                                    ? C.red
                                    : C.lime,
                                fontSize: 13,
                                marginBottom: 16,
                            }}
                        >
                            {message}
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="lime"
                        fullWidth
                        disabled={loading || !name.trim()}
                    >
                        {loading
                            ? 'Creando cuenta...'
                            : 'Crear cuenta'}
                    </Button>
                </form>

                <div
                    style={{
                        marginTop: 24,
                        textAlign: 'center',
                    }}
                >
                    <p style={T.pageSub}>
                        ¿Ya tenés cuenta?
                    </p>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={goToLogin}
                    >
                        Iniciar sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}