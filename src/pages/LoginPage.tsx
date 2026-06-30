import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { parseAxiosError } from '../utils/errorMessages';
import { isUtecEmail } from '../utils/validators';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isUtecEmail(email)) next.email = 'Debe ser un correo @utec.edu.pe';
    if (!password) next.password = 'Ingresa tu contrasena';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      await login(res.accessToken, res.refreshToken, res.user);
      navigate('/home');
    } catch (error) {
      setMessage(parseAxiosError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="public-page auth-background">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Bienvenido de vuelta</h1>
        <p>Accede con tu correo institucional UTEC.</p>
        {message ? <div className="alert alert-error">{message}</div> : null}
        <AppInput label="Correo UTEC" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.nombre@utec.edu.pe" error={errors.email} />
        <AppInput label="Contrasena" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimo 8 caracteres" error={errors.password} />
        <AppButton type="submit" loading={loading}>Iniciar sesion</AppButton>
        <Link className="btn btn-outline" to="/register">No tengo cuenta</Link>
      </form>
    </main>
  );
};
