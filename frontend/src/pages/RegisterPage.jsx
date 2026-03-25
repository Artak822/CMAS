import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { User, Phone, Mail, Lock, Calendar, ShieldCheck } from 'lucide-react'

const ROLES = [
  { value: 'student',    label: 'Студент' },
  { value: 'commandant', label: 'Комендант' },
  { value: 'admin',      label: 'Администратор' },
]

export default function RegisterPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', phone: '', birth_date: '', email: '', password: '', role: 'student',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      const data = await login(form.email, form.password)
      signIn(data)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (!detail) setError(err.message || 'Сервер недоступен')
      else if (typeof detail === 'string') setError(detail)
      else if (Array.isArray(detail)) setError(detail.map((d) => `${d.loc?.at(-1)}: ${d.msg}`).join(' | '))
      else setError(JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            CM<span className="text-indigo-600">AS</span>
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-4">Создать аккаунт</h2>
          <p className="text-slate-500 text-sm mt-1">Заполните данные для регистрации</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="ФИО">
              <div className="field-icon-wrap">
                <User size={15} className="icon" />
                <input required value={form.full_name} onChange={set('full_name')}
                  className="field field-icon" placeholder="Иванов Иван Иванович" />
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Телефон">
                <div className="field-icon-wrap">
                  <Phone size={15} className="icon" />
                  <input required value={form.phone} onChange={set('phone')}
                    className="field field-icon" placeholder="+79991234567" />
                </div>
              </FormField>
              <FormField label="Дата рождения">
                <div className="field-icon-wrap">
                  <Calendar size={15} className="icon" />
                  <input type="date" required value={form.birth_date} onChange={set('birth_date')}
                    className="field field-icon" />
                </div>
              </FormField>
            </div>

            <FormField label="Email">
              <div className="field-icon-wrap">
                <Mail size={15} className="icon" />
                <input type="email" required value={form.email} onChange={set('email')}
                  className="field field-icon" placeholder="you@example.com" />
              </div>
            </FormField>

            <FormField label="Пароль">
              <div className="field-icon-wrap">
                <Lock size={15} className="icon" />
                <input type="password" required minLength={6} value={form.password} onChange={set('password')}
                  className="field field-icon" placeholder="Минимум 6 символов" />
              </div>
            </FormField>

            <FormField label="Роль">
              <div className="field-icon-wrap">
                <ShieldCheck size={15} className="icon" />
                <select value={form.role} onChange={set('role')} className="field field-icon"
                  style={{ appearance: 'none' }}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </FormField>

            {error && (
              <div className="alert-error"><span>⚠</span><span>{error}</span></div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Войти</Link>
        </p>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
