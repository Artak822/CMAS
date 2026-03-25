import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRooms, createFloor, createRoom } from '../api/rooms'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { Plus, X, BedDouble, Layers } from 'lucide-react'

export default function RoomsPage() {
  const { isStaff } = useAuth()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [floorForm, setFloorForm] = useState({ number: '', dormitory: '' })
  const [roomForm, setRoomForm] = useState({ number: '', floor_id: '', capacity: 2 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => getRooms().then(setRooms).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreateFloor = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createFloor({ number: Number(floorForm.number), dormitory: floorForm.dormitory })
      setModal(null); setFloorForm({ number: '', dormitory: '' })
    } catch (err) { setError(err.response?.data?.detail ?? 'Ошибка') }
    finally { setSaving(false) }
  }

  const handleCreateRoom = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await createRoom({ number: Number(roomForm.number), floor_id: Number(roomForm.floor_id), capacity: Number(roomForm.capacity) })
      setModal(null); setRoomForm({ number: '', floor_id: '', capacity: 2 }); load()
    } catch (err) { setError(err.response?.data?.detail ?? 'Ошибка') }
    finally { setSaving(false) }
  }

  const freeCount   = rooms.filter(r => r.status === 'free').length
  const occupied    = rooms.filter(r => r.free_places < r.capacity && r.status !== 'repair').length
  const repairCount = rooms.filter(r => r.status === 'repair').length

  return (
    <Layout>
      <div className="page-header row-between">
        <div>
          <h1 className="page-title">Комнаты</h1>
          <p className="page-subtitle">
            {isStaff ? `${rooms.length} комнат · ${freeCount} свободных` : `${rooms.length} комнат`}
          </p>
        </div>
        {isStaff && (
          <div className="row">
            <button onClick={() => { setModal('floor'); setError('') }} className="btn btn-secondary btn-sm">
              <Layers size={14} />Этаж
            </button>
            <button onClick={() => { setModal('room'); setError('') }} className="btn btn-primary btn-sm">
              <Plus size={14} />Комната
            </button>
          </div>
        )}
      </div>

      {/* Stats — только для staff */}
      {isStaff && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { label: 'Свободно', value: freeCount,   bg: '#f0fdf4', color: '#16a34a' },
            { label: 'Занято',   value: occupied,     bg: '#fffbeb', color: '#d97706' },
            { label: 'Ремонт',   value: repairCount,  bg: '#fef2f2', color: '#dc2626' },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 16, padding: '16px 20px' }}>
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loading
        ? <div className="spinner-wrap"><div className="spinner" /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {rooms.map(room => {
              const pct = ((room.capacity - room.free_places) / room.capacity) * 100
              return (
                <Link key={room.id} to={`/rooms/${room.id}`} className="room-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, background: '#eef2ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BedDouble size={15} style={{ color: '#6366f1' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>Комната {room.number}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Этаж {room.floor_id}</div>
                      </div>
                    </div>
                    <StatusBadge status={room.status} dot={false} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Заполненность</span>
                    <span style={{ color: '#475569', fontWeight: 500 }}>{room.capacity - room.free_places}/{room.capacity}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#6366f1'
                    }} />
                  </div>
                </Link>
              )
            })}
            {rooms.length === 0 && (
              <div className="card" style={{ gridColumn: '1/-1' }}>
                <div className="empty"><BedDouble size={28} style={{ color: '#e2e8f0' }} /><span>Комнат нет</span></div>
              </div>
            )}
          </div>
        )}

      {modal && (
        <Modal title={modal === 'floor' ? 'Новый этаж' : 'Новая комната'} onClose={() => setModal(null)}>
          {modal === 'floor' ? (
            <form onSubmit={handleCreateFloor} className="stack">
              <FormField label="Номер этажа">
                <input type="number" required value={floorForm.number}
                  onChange={e => setFloorForm({ ...floorForm, number: e.target.value })}
                  className="field" placeholder="1" />
              </FormField>
              <FormField label="Название">
                <input required value={floorForm.dormitory}
                  onChange={e => setFloorForm({ ...floorForm, dormitory: e.target.value })}
                  className="field" placeholder="Общежитие №1" />
              </FormField>
              {error && <div className="alert-error"><span>⚠</span><span>{error}</span></div>}
              <div className="row">
                <button type="submit" disabled={saving} className="btn btn-primary">Создать</button>
                <button type="button" onClick={() => setModal(null)} className="btn btn-ghost">Отмена</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="stack">
              <div className="grid-2">
                <FormField label="Номер комнаты">
                  <input type="number" required value={roomForm.number}
                    onChange={e => setRoomForm({ ...roomForm, number: e.target.value })}
                    className="field" placeholder="101" />
                </FormField>
                <FormField label="ID этажа">
                  <input type="number" required value={roomForm.floor_id}
                    onChange={e => setRoomForm({ ...roomForm, floor_id: e.target.value })}
                    className="field" placeholder="1" />
                </FormField>
              </div>
              <FormField label="Мест в комнате">
                <input type="number" min={1} max={10} required value={roomForm.capacity}
                  onChange={e => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  className="field" />
              </FormField>
              {error && <div className="alert-error"><span>⚠</span><span>{error}</span></div>}
              <div className="row">
                <button type="submit" disabled={saving} className="btn btn-primary">Создать</button>
                <button type="button" onClick={() => setModal(null)} className="btn btn-ghost">Отмена</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </Layout>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 400, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{title}</span>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return <div><label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>{label}</label>{children}</div>
}
