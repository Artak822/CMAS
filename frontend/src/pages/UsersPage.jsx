import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUsers } from '../api/users'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { Search, BedDouble, ExternalLink } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { getUsers().then(setUsers).finally(() => setLoading(false)) }, [])

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Жильцы</h1>
          <p className="page-subtitle">{users.length} человек зарегистрировано</p>
        </div>
        <div className="field-icon-wrap">
          <Search size={14} className="icon" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск..." className="field field-icon" style={{ width: 220 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div className="spinner-wrap"><div className="spinner" /></div>
          : (
            <table className="table">
              <thead>
                <tr>
                  <th>Жилец</th><th>Роль</th><th>Комната</th><th>Телефон</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#eef2ff', color: '#6366f1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>{u.full_name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13, color: '#1e293b' }}>{u.full_name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      {u.room_id
                        ? <Link to={`/rooms/${u.room_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6366f1', textDecoration: 'none' }}>
                            <BedDouble size={13} />#{u.room_id}
                          </Link>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>{u.phone}</td>
                    <td>
                      <Link to={`/profile/${u.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, color: '#94a3b8', textDecoration: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.color = '#6366f1' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}>
                        <ExternalLink size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty">
                      <Search size={24} style={{ color: '#e2e8f0' }} />
                      <span>Жильцы не найдены</span>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
      </div>
    </Layout>
  )
}
