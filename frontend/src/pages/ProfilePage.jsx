import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProfile } from '../api/users'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, Mail, Phone, Calendar, BedDouble, ClipboardList, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getProfile(id).then(setData).finally(() => setLoading(false)) }, [id])

  if (loading) return <Layout><div className="spinner-wrap"><div className="spinner" /></div></Layout>
  if (!data) return <Layout><p style={{ color: '#94a3b8' }}>Профиль не найден</p></Layout>

  const { user, room, requests } = data

  return (
    <Layout>
      <div style={{ maxWidth: 560 }}>
        <Link to="/users" className="back-link"><ArrowLeft size={14} />Назад</Link>

        {/* Header */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#eef2ff', color: '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 22, flexShrink: 0,
            }}>{user.full_name.charAt(0)}</div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{user.full_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <StatusBadge status={user.role} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>#{user.id}</span>
              </div>
            </div>
          </div>
          <hr className="divider" style={{ marginBottom: 16 }} />
          <div className="stack-sm">
            {[
              { Icon: Mail,     label: 'Email',          value: user.email },
              { Icon: Phone,    label: 'Телефон',        value: user.phone },
              { Icon: Calendar, label: 'Дата рождения',  value: user.birth_date ? new Date(user.birth_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            ].map(({ Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color: '#94a3b8' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Room */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <BedDouble size={14} style={{ color: '#a5b4fc' }} />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Проживание</span>
          </div>
          {room ? (
            <Link to={`/rooms/${room.id}`} style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13, color: '#1e293b' }}>Комната {room.number}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Этаж {room.floor_id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={room.status} />
                <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
              </div>
            </Link>
          ) : (
            <div className="empty" style={{ padding: '20px 0' }}><span>Комната не назначена</span></div>
          )}
        </div>

        {/* Requests */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>
            <ClipboardList size={14} style={{ color: '#a5b4fc' }} />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Заявки</span>
            {requests?.length > 0 && <span className="badge-number" style={{ marginLeft: 'auto' }}>{requests.length}</span>}
          </div>
          {requests?.length > 0 ? (
            requests.map((req, i) => (
              <Link key={req.id} to={`/requests/${req.id}`} style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 20px', borderBottom: i < requests.length - 1 ? '1px solid #f8fafc' : 'none',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafe'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{req.category}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date(req.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={req.status} />
                  <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
                </div>
              </Link>
            ))
          ) : (
            <div className="empty"><span>Заявок нет</span></div>
          )}
        </div>
      </div>
    </Layout>
  )
}
