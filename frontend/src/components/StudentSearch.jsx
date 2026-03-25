import { useState, useEffect, useRef } from 'react'
import { getUsers } from '../api/users'
import { Search, X } from 'lucide-react'

export default function StudentSearch({ value, onChange, placeholder = 'Поиск по фамилии или имени...' }) {
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    getUsers().then(users => setStudents(users.filter(u => u.role === 'student')))
  }, [])

  useEffect(() => {
    if (!query.trim()) { setFiltered([]); return }
    const q = query.toLowerCase()
    setFiltered(students.filter(s => s.full_name?.toLowerCase().includes(q)).slice(0, 8))
  }, [query, students])

  // Клик вне — закрыть дропдаун
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = student => {
    setSelected(student)
    setQuery(student.full_name)
    setOpen(false)
    onChange(student.id)
  }

  const clear = () => {
    setSelected(null)
    setQuery('')
    setOpen(false)
    onChange('')
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: '#94a3b8', pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) { setSelected(null); onChange('') } }}
          onFocus={() => { if (query) setOpen(true) }}
          className="field"
          style={{ paddingLeft: 36, paddingRight: selected ? 36 : 12 }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {selected && (
          <button type="button" onClick={clear} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: '#94a3b8', display: 'flex', alignItems: 'center',
          }}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {filtered.map(s => (
            <button key={s.id} type="button" onMouseDown={() => select(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', border: 'none',
                background: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#eef2ff', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {s.full_name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{s.full_name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.email} · #{s.id}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '12px 16px', fontSize: 13, color: '#94a3b8',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          Студенты не найдены
        </div>
      )}
    </div>
  )
}
