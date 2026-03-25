import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, BedDouble, ClipboardList, Users, LogOut } from 'lucide-react'

const NAV_ALL = [
  { to: '/dashboard', label: 'Главная', Icon: LayoutDashboard },
  { to: '/requests',  label: 'Заявки',  Icon: ClipboardList },
]
const NAV_STAFF = [
  { to: '/dashboard', label: 'Главная',  Icon: LayoutDashboard },
  { to: '/rooms',     label: 'Комнаты',  Icon: BedDouble },
  { to: '/requests',  label: 'Заявки',   Icon: ClipboardList },
]

export default function Navbar() {
  const { user, isStaff, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Left: logo + links */}
        <div className="row">
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px', color: '#0f172a' }}>
            CM<span style={{ color: '#6366f1' }}>AS</span>
          </span>

          <nav className="navbar-links" style={{ marginLeft: 16 }}>
            {(isStaff ? NAV_STAFF : NAV_ALL).map(({ to, label, Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Icon size={14} />{label}
              </NavLink>
            ))}
            {isStaff && (
              <NavLink to="/users"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Users size={14} />Жильцы
              </NavLink>
            )}
          </nav>
        </div>

        {/* Right: user */}
        <div className="navbar-right">
          <NavLink to={`/profile/${user?.id}`}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#eef2ff', color: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12,
            }}>
              {user?.full_name?.charAt(0)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
              {user?.full_name?.split(' ')[0]}
            </span>
          </NavLink>

          <RolePill role={user?.role} />

          <button onClick={() => { signOut(); navigate('/login') }}
            title="Выйти"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, borderRadius: 8, color: '#94a3b8',
              display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}

function RolePill({ role }) {
  const map = {
    student:    { bg: '#f1f5f9', color: '#64748b' },
    commandant: { bg: '#f5f3ff', color: '#7c3aed' },
    admin:      { bg: '#eef2ff', color: '#4f46e5' },
  }
  const labels = { student: 'Студент', commandant: 'Комендант', admin: 'Админ' }
  const s = map[role] ?? map.student
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 99, background: s.bg, color: s.color,
    }}>
      {labels[role] ?? role}
    </span>
  )
}
