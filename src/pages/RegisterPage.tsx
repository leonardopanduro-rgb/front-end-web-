import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { CAREERS } from '../data/careers';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import { parseAxiosError } from '../utils/errorMessages';
import { isUtecEmail, isValidCareer, isValidCycle, isValidPassword, isValidPhone, isValidStudentCode } from '../utils/validators';

const initialForm = {
  name: '',
  lastName: '',
  email: '',
  password: '',
  confirm: '',
  phone: '',
  studentCode: '',
  career: '',
  cycle: '',
};

export const RegisterPage = () => {
  const { login, setPendingVehicleSetup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Ingresa tu nombre';
    if (!form.lastName.trim()) next.lastName = 'Ingresa tu apellido';
    if (!isUtecEmail(form.email)) next.email = 'El correo debe ser @utec.edu.pe';
    if (!isValidPassword(form.password)) next.password = 'Minimo 8 caracteres con letras y numeros';
    if (form.password !== form.confirm) next.confirm = 'Las contrasenas no coinciden';
    if (!isValidPhone(form.phone)) next.phone = 'El telefono debe tener 9 digitos';
    if (!isValidStudentCode(form.studentCode)) next.studentCode = 'Debe tener 9 digitos';
    if (!isValidCareer(form.career)) next.career = 'Selecciona una carrera';
    const cycle = Number.parseInt(form.cycle, 10);
    if (!isValidCycle(cycle)) next.cycle = 'El ciclo debe estar entre 1 y 12';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        studentCode: `U${form.studentCode.trim()}`,
        career: form.career,
        cycle: Number.parseInt(form.cycle, 10),
      });
      setPendingVehicleSetup(true);
      await login(res.accessToken, res.refreshToken, res.user);
      navigate('/setup-vehicle');
    } catch (error) {
      setMessage(parseAxiosError(error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="public-page auth-background">
      <form className="auth-card wide" onSubmit={handleSubmit}>
        <h1>Crear cuenta UTEC</h1>
        <p>Completa tus datos academicos para usar Carpool UTEC.</p>
        {message ? <div className="alert alert-error">{message}</div> : null}
        <div className="form-grid two">
          <AppInput label="Nombre" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          <AppInput label="Apellido" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
          <AppInput label="Correo UTEC" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          <AppInput label="Telefono" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
          <AppInput label="Codigo de estudiante" value={form.studentCode} onChange={(e) => set('studentCode', e.target.value)} placeholder="202210566" error={errors.studentCode} />
          <AppInput label="Ciclo" type="number" min={1} max={12} value={form.cycle} onChange={(e) => set('cycle', e.target.value)} error={errors.cycle} />
          <AppInput label="Contrasena" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} />
          <AppInput label="Confirmar contrasena" type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} error={errors.confirm} />
        </div>
        <label className="field">
          <span className="field-label">Carrera</span>
          <select className={`input ${errors.career ? 'input-error' : ''}`} value={form.career} onChange={(e) => set('career', e.target.value)}>
            <option value="">Selecciona tu carrera</option>
            {CAREERS.map((career) => <option key={career.value} value={career.value}>{career.label}</option>)}
          </select>
          {errors.career ? <span className="field-error">{errors.career}</span> : null}
        </label>
        <AppButton type="submit" loading={loading}>Crear cuenta</AppButton>
        <Link className="btn btn-outline" to="/login">Ya tengo cuenta</Link>
      </form>
    </main>
  );
};
