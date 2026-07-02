import { useState } from 'react';
import { authService } from '../services/authServices';
import { Button, Input } from '../components/ui';
import { C, T } from '../styles/theme';

interface LoginViewProps {
    goToRegister: () => void;
}

export default function LoginView({ goToRegister }: LoginViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            const { error: authError } = await authService.login(email, password);
            if (authError) throw authError;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ ...T.card, width: 420, maxWidth: '100%' }}>
                <h1 style={T.pageHead}>Iniciar sesión</h1>
                <p style={T.pageSub}>Accedé a tu cuenta de Pymen</p>

                <form onSubmit={handleLogin} style={{ marginTop: 24 }}>
                    <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                    {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}

                    <Button type="submit" variant="lime" fullWidth disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </form>

                <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <p style={T.pageSub}>¿No tenés cuenta?</p>
                    <Button type="button" variant="ghost" onClick={goToRegister}>Crear cuenta</Button>
                </div>
            </div>
        </div>
    );
}