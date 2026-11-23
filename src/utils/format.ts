export const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'

// "07:15 AM" today, "Nov 20, 07:15 AM" on other days
export function formatLogTime(iso: string) {
  const date = new Date(iso)
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date.toDateString() === new Date().toDateString() ? time : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

// "Just now", "10 mins ago", "2 hours ago", "Yesterday", "3 days ago", or the date
export function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 2) return 'Just now'
  if (minutes < 60) return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' })
}

// Online = used the app in the last 15 minutes
export const isOnline = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < 15 * 60_000

export const roleLabel = (role: string) => (role === 'admin' ? 'Admin' : role === 'volunteer' ? 'Volunteer' : 'System')
