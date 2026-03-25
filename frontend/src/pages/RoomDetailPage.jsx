import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRoom, assignRoom, evictRoom } from '../api/rooms'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import StudentSearch from '../components/StudentSearch'
import { ArrowLeft, UserPlus, UserMinus } from 'lucide-react'

export default function RoomDetailPage() {
  const { id } = useParams()
  const { isStaff } = useAuth()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('assign')
  const [assignForm, setAssignForm] = useState({ student_id: '', check_in_date: '' })
  const [evictForm, setEvictForm] = useState({ student_id: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: true })

  const load = () => getRoom(id).then(setRoom).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const handleAssign = async e => {
    e.preventDefault(); setSaving(true); setMsg({ text: '', ok: true })
    try {
      await assignRoom({ student_id: Number(assignForm.student_id), room_id: Number(id), ...(assignForm.check_in_date ? { check_in_date: assignForm.check_in_date } : {}) })
      setMsg({ text: 'Студент успешно заселён', ok: true }); setAssignForm({ student_id: '', check_in_date: '' }); load()
    } catch (err) { setMsg({ text: err.response?.data?.detail ?? 'Ошибка', ok: false }) }
    finally { setSaving(false) }
  }

  const handleEvict = async e => {
    e.preventDefault(); setSaving(true); setMsg({ text: '', ok: true })
    try {
      await evictRoom({ student_id: Number(evictForm.student_id), room_id: Number(id) })
      setMsg({ text: 'Студент выселен', ok: true }); setEvictForm({ student_id: '' }); load()
    } catch (err) { setMsg({ text: err.response?.data?.detail ?? 'Ошибка', ok: false }) }
    finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="spinner-wrap"><div className="spinner" /></div></Layout>
  if (!room)   return <Layout><p style={{ color: '#94a3b8' }}>Комната не найдена</p></Layout>

  const pct = ((room.capacity - room.free_places) / room.capacity) * 100

  return (
    <Layout>
      <div style={{ maxWidth: 520 }}>
        <Link to="/rooms" className="back-link"><ArrowLeft size={14} />Назад к комнатам</Link>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Комната {room.number}</h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Этаж {room.floor_id}</p>
            </div>
            <StatusBadge status={room.status} />
          </div>

          <div className="grid-3" style={{ marginBottom: 16, gap: 10 }}>
            {[
              { label: 'Вместимость', value: room.capacity },
              { label: 'Занято',      value: room.capacity - room.free_places },
              { label: 'Свободно',    value: room.free_places },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              <span>Заполненность</span><span style={{ color: '#475569', fontWeight: 500 }}>{Math.round(pct)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#6366f1' }} />
            </div>
          </div>
        </div>

        {isStaff && (
          <div className="card">
            <div className="tab-group" style={{ marginBottom: 20, width: '100%' }}>
              {[{ key: 'assign', label: 'Заселить', Icon: UserPlus }, { key: 'evict', label: 'Выселить', Icon: UserMinus }].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => { setTab(key); setMsg({ text: '', ok: true }) }}
                  className={`tab${tab === key ? ' active' : ''}`} style={{ flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon size={13} />{label}</span>
                </button>
              ))}
            </div>

            {msg.text && (
              <div className={msg.ok ? 'alert-success' : 'alert-error'} style={{ marginBottom: 16 }}>
                {msg.ok ? '✓' : '⚠'} {msg.text}
              </div>
            )}

            {tab === 'assign' ? (
              <form onSubmit={handleAssign} className="stack">
                <FL label="Студент">
                  <StudentSearch
                    value={assignForm.student_id}
                    onChange={id => setAssignForm({ ...assignForm, student_id: id })}
                  />
                </FL>
                <FL label="Дата заезда (необязательно)">
                  <input type="date" value={assignForm.check_in_date}
                    onChange={e => setAssignForm({ ...assignForm, check_in_date: e.target.value })}
                    className="field" />
                </FL>
                <button type="submit" disabled={saving || !assignForm.student_id} className="btn btn-primary w-full">
                  <UserPlus size={14} />{saving ? 'Заселение...' : 'Заселить'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEvict} className="stack">
                <FL label="Студент">
                  <StudentSearch
                    value={evictForm.student_id}
                    onChange={id => setEvictForm({ student_id: id })}
                    placeholder="Поиск по фамилии или имени..."
                  />
                </FL>
                <button type="submit" disabled={saving || !evictForm.student_id} className="btn btn-danger w-full">
                  <UserMinus size={14} />{saving ? 'Выселение...' : 'Выселить'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function FL({ label, children }) {
  return <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>{label}</label>{children}</div>
}
