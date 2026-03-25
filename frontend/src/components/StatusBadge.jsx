const STYLES = {
  free:        { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
  partial:     { bg: '#fffbeb', color: '#d97706', border: '#fde68a', dot: '#f59e0b' },
  repair:      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', dot: '#ef4444' },
  created:     { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', dot: '#3b82f6' },
  in_progress: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', dot: '#8b5cf6' },
  done:        { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', dot: '#22c55e' },
  student:     { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' },
  commandant:  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', dot: '#8b5cf6' },
  admin:       { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe', dot: '#6366f1' },
}

const LABELS = {
  free: 'Свободна', partial: 'Частично', repair: 'Ремонт',
  created: 'Создана', in_progress: 'В работе', done: 'Выполнена',
  student: 'Студент', commandant: 'Комендант', admin: 'Админ',
}

export default function StatusBadge({ status, dot = true }) {
  const s = STYLES[status] ?? STYLES.student
  const label = LABELS[status] ?? status

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: s.dot,
          flexShrink: 0,
        }} />
      )}
      {label}
    </span>
  )
}
