import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRequest, updateRequestStatus, addComment } from '../api/requests'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, Send, CheckCheck, PlayCircle } from 'lucide-react'

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user, isStaff } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => getRequest(id).then(setRequest).finally(() => setLoading(false))
  useEffect(() => { load() }, [id])

  const handleStatus = async status => { await updateRequestStatus(id, { status }); load() }

  const handleComment = async e => {
    e.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try { await addComment(id, { author_id: user.id, text: comment }); setComment(''); load() }
    finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="spinner-wrap"><div className="spinner" /></div></Layout>
  if (!request) return <Layout><p style={{ color: '#94a3b8' }}>Заявка не найдена</p></Layout>

  return (
    <Layout>
      <div style={{ maxWidth: 640 }}>
        <Link to="/requests" className="back-link"><ArrowLeft size={14} />Назад к заявкам</Link>

        {/* Request card */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{request.category}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
            Заявка #{request.id} · Комната {request.room_id} ·{' '}
            {new Date(request.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>
            {request.description}
          </div>
          {isStaff && request.status !== 'done' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {request.status === 'created' && (
                <button onClick={() => handleStatus('in_progress')} className="btn btn-primary btn-sm">
                  <PlayCircle size={13} />Взять в работу
                </button>
              )}
              {request.status === 'in_progress' && (
                <button onClick={() => handleStatus('done')} className="btn btn-sm"
                  style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7' }}>
                  <CheckCheck size={13} />Отметить выполненной
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Комментарии</span>
            {request.comments?.length > 0 && (
              <span className="badge-number">{request.comments.length}</span>
            )}
          </div>

          {request.comments?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              {request.comments.map(c => {
                const isMe = c.author_id === user.id
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isMe ? '#6366f1' : '#f1f5f9',
                      color: isMe ? 'white' : '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11, flexShrink: 0,
                    }}>{c.author_id}</div>
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        background: isMe ? '#6366f1' : '#f1f5f9',
                        color: isMe ? 'white' : '#374151',
                        fontSize: 13, lineHeight: 1.5,
                      }}>{c.text}</div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(c.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty" style={{ paddingTop: 24, paddingBottom: 24 }}>
              <span>Пока нет комментариев</span>
            </div>
          )}

          <hr className="divider" style={{ marginBottom: 16 }} />

          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
            <input value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Написать комментарий..." className="field" style={{ flex: 1 }} />
            <button type="submit" disabled={saving || !comment.trim()} className="btn btn-primary" style={{ padding: '10px 14px' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
