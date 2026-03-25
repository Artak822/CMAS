import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.email, form.password)
      signIn(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc' }}>

      {/* Left accent panel */}
      <div style={{
        width: '45%', background: '#6366f1',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 20, color: 'white', letterSpacing: '-0.3px' }}>
            CM<span style={{ color: '#c7d2fe' }}>AS</span>
          </span>
        </div>

        {/* Title */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: 'white', fontSize: 40, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.5px', margin: 0 }}>
            Управление<br />общежитием
          </h1>
          <p style={{ color: '#c7d2fe', fontSize: 15, marginTop: 16, lineHeight: 1.6 }}>
            Комнаты, жильцы и заявки —<br />всё под рукой.
          </p>
        </div>

        {/* Empty bottom spacer */}
        <div style={{ position: 'relative', zIndex: 1, height: 24 }} />
      </div>

      {/* Right form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 64px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Добро пожаловать</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>Войдите в аккаунт чтобы продолжить</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Email">
              <div className="field-icon-wrap">
                <Mail size={15} className="icon" />
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="field field-icon" placeholder="you@example.com" />
              </div>
            </FormField>

            <FormField label="Пароль">
              <div className="field-icon-wrap">
                <Lock size={15} className="icon" />
                <input type="password" required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="field field-icon" placeholder="••••••••" />
              </div>
            </FormField>

            {error && (
              <div className="alert-error"><span>⚠</span><span>{error}</span></div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Вход...' : <><span>Войти</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#94a3b8' }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
