import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

const STATUS_LABEL = {
  pending: { text: 'Pending', emoji: '⏳' },
  coming: { text: 'Coming', emoji: '💃' },
  not_coming: { text: "Can't make it", emoji: '🥺' },
}

function useCountdown(isoDate) {
  const [remaining, setRemaining] = useState(null)
  useEffect(() => {
    if (!isoDate) return
    const target = new Date(isoDate).getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setRemaining({ d: 0, h: 0, m: 0, s: 0 }); return }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isoDate])
  return remaining
}

export default function App() {
  const [config, setConfig] = useState(null)
  const [guests, setGuests] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin')
  const [rsvpTarget, setRsvpTarget] = useState(null)

  const loadAll = useCallback(async () => {
    const [{ data: cfg }, { data: g }, { data: r }] = await Promise.all([
      supabase.from('config').select('*').eq('id', 1).single(),
      supabase.from('guests').select('*').order('name'),
      supabase.from('plus_one_requests').select('*').order('created_at', { ascending: false }),
    ])
    setConfig(cfg || null)
    setGuests(g || [])
    setRequests(r || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
    const onHash = () => setIsAdmin(window.location.hash === '#admin')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [loadAll])

  const countdown = useCountdown(config?.event_date_iso)

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-body)' }}>Loading…</div>
  }

  if (isAdmin) {
    return <AdminPanel config={config} guests={guests} requests={requests} reload={loadAll} />
  }

  return (
    <div>
      <Hero config={config} countdown={countdown} />
      <Details config={config} />
      {config?.photo_album_link ? <Photos link={config.photo_album_link} /> : null}
      {guests.length > 0 ? (
        <GuestList guests={guests} onRsvp={(g) => setRsvpTarget(g)} />
      ) : null}
      <Footer />
      {rsvpTarget ? (
        <RsvpModal
          guest={rsvpTarget}
          guestPassword={config?.guest_password}
          onClose={() => setRsvpTarget(null)}
          onDone={loadAll}
        />
      ) : null}
    </div>
  )
}

function Hero({ config, countdown }) {
  return (
    <section style={{
      minHeight: '92vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '40px 20px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-warm) 100%)',
    }}>
      <EqBars />
      <p style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
        We're getting married
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px, 10vw, 104px)', fontWeight: 500, margin: 0, color: 'var(--ink)', lineHeight: 1.02 }}>
        Bentley <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>&</span> Robyn
      </h1>
      <p style={{ marginTop: 18, fontSize: 18, color: 'var(--ink-soft)' }}>
        {config?.event_date_display || 'Date coming soon'}
      </p>
      {countdown ? (
        <div style={{ display: 'flex', gap: 20, marginTop: 36 }}>
          {[['Days', countdown.d], ['Hrs', countdown.h], ['Min', countdown.m], ['Sec', countdown.s]].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ink)' }}>{String(val).padStart(2, '0')}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>{label}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function EqBars() {
  const bars = Array.from({ length: 24 })
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'flex-end', height: 120, opacity: 0.25, pointerEvents: 'none' }}>
      {bars.map((_, i) => (
        <div key={i} style={{
          width: 8, background: 'var(--accent)', borderRadius: 4,
          animation: `eq 1.2s ease-in-out ${i * 0.07}s infinite alternate`,
          height: 20,
        }} />
      ))}
      <style>{`@keyframes eq { from { height: 14px; } to { height: 100px; } }`}</style>
    </div>
  )
}

function Details({ config }) {
  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 24 }}>The Details</h2>
      <div style={{ display: 'grid', gap: 16, fontSize: 17, color: 'var(--ink-soft)' }}>
        <div><strong style={{ color: 'var(--ink)' }}>Venue:</strong> {config?.venue_name}</div>
        <div><strong style={{ color: 'var(--ink)' }}>Address:</strong> {config?.venue_address}</div>
        <div><strong style={{ color: 'var(--ink)' }}>Doors:</strong> {config?.doors_time}</div>
      </div>
    </section>
  )
}

function Photos({ link }) {
  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 16 }}>Photos</h2>
      <a href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>
        View the shared photo album →
      </a>
    </section>
  )
}

function GuestList({ guests, onRsvp }) {
  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 80px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 24, textAlign: 'center' }}>Guest List</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {guests.map((g) => {
          const s = STATUS_LABEL[g.rsvp_status] || STATUS_LABEL.pending
          return (
            <div key={g.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 'var(--radius)',
              padding: '14px 18px',
            }}>
              <span>{g.name}{g.is_plus_one ? <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}> (+1)</span> : null}</span>
              <button
                onClick={() => onRsvp(g)}
                style={{
                  border: 'none', background: 'var(--bg-warm)', borderRadius: 999,
                  padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  color: 'var(--ink)',
                }}
              >
                {s.emoji} {s.text}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RsvpModal({ guest, guestPassword, onClose, onDone }) {
  const [step, setStep] = useState('form') // 'form' | 'plusone' | 'done'
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState(guest.rsvp_status === 'pending' ? 'coming' : guest.rsvp_status)
  const [email, setEmail] = useState(guest.email || '')
  const [phone, setPhone] = useState(guest.phone || '')
  const [note, setNote] = useState(guest.note || '')
  const [error, setError] = useState('')
  const [plusOneName, setPlusOneName] = useState('')
  const [plusOneSent, setPlusOneSent] = useState(false)

  async function submitRsvp(e) {
    e.preventDefault()
    setError('')
    if (password !== guestPassword) { setError('Incorrect password.'); return }
    if (!email) { setError('Email is required.'); return }
    const { error: err } = await supabase
      .from('guests')
      .update({ rsvp_status: status, email, phone, note })
      .eq('id', guest.id)
    if (err) { setError('Something went wrong saving your RSVP.'); return }
    setStep('done')
    onDone()
  }

  async function submitPlusOne(e) {
    e.preventDefault()
    setError('')
    if (password !== guestPassword) { setError('Incorrect password.'); return }
    if (!plusOneName) { setError("Enter who you'd like to bring."); return }
    const { error: err } = await supabase
      .from('plus_one_requests')
      .insert({ requested_by_name: guest.name, plus_one_name: plusOneName })
    if (err) { setError('Something went wrong sending the request.'); return }
    setPlusOneSent(true)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtnStyle} aria-label="Close">×</button>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginTop: 0 }}>{guest.name}</h3>

        {step === 'form' && (
          <form onSubmit={submitRsvp} style={{ display: 'grid', gap: 14 }}>
            <label style={labelStyle}>
              Guest list password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStatus('coming')} style={pillBtn(status === 'coming')}>💃 Coming</button>
              <button type="button" onClick={() => setStatus('not_coming')} style={pillBtn(status === 'not_coming')}>🥺 Can't make it</button>
            </div>
            <label style={labelStyle}>
              Email <span style={{ color: 'var(--accent-deep)' }}>*</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            </label>
            <label style={labelStyle}>
              Phone (optional)
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Note (optional)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, minHeight: 70 }} />
            </label>
            {error ? <p style={errorStyle}>{error}</p> : null}
            <button type="submit" style={primaryBtnStyle}>Save RSVP</button>
            <button type="button" onClick={() => setStep('plusone')} style={secondaryBtnStyle}>+ Request a plus one</button>
          </form>
        )}

        {step === 'plusone' && !plusOneSent && (
          <form onSubmit={submitPlusOne} style={{ display: 'grid', gap: 14 }}>
            <label style={labelStyle}>
              Guest list password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
            </label>
            <label style={labelStyle}>
              Who are you bringing?
              <input type="text" value={plusOneName} onChange={(e) => setPlusOneName(e.target.value)} style={inputStyle} required />
            </label>
            {error ? <p style={errorStyle}>{error}</p> : null}
            <button type="submit" style={primaryBtnStyle}>Send request</button>
            <button type="button" onClick={() => setStep('form')} style={secondaryBtnStyle}>Back</button>
          </form>
        )}

        {step === 'plusone' && plusOneSent && (
          <p>Request sent! Once it's approved, {plusOneName} will show up on the guest list and can RSVP themselves.</p>
        )}

        {step === 'done' && <p>RSVP saved — thank you!</p>}
      </div>
    </div>
  )
}

function AdminPanel({ config, guests, requests, reload }) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pw === config?.admin_password) setAuthed(true)
            else setError('Wrong password.')
          }}
          style={{ ...modalStyle, position: 'static' }}
        >
          <h3 style={{ fontFamily: 'var(--font-display)' }}>Admin</h3>
          <input type="password" placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} style={inputStyle} autoFocus />
          {error ? <p style={errorStyle}>{error}</p> : null}
          <button type="submit" style={{ ...primaryBtnStyle, marginTop: 12 }}>Enter</button>
        </form>
      </div>
    )
  }

  return <AdminDashboard config={config} guests={guests} requests={requests} reload={reload} />
}

function AdminDashboard({ config, guests, requests, reload }) {
  const [form, setForm] = useState(config || {})
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' })
  const [savedMsg, setSavedMsg] = useState('')

  async function saveConfig(e) {
    e.preventDefault()
    await supabase.from('config').update({
      event_date_display: form.event_date_display,
      event_date_iso: form.event_date_iso,
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      doors_time: form.doors_time,
      photo_album_link: form.photo_album_link,
    }).eq('id', 1)
    setSavedMsg('Saved!')
    reload()
    setTimeout(() => setSavedMsg(''), 2000)
  }

  async function addGuest(e) {
    e.preventDefault()
    if (!newGuest.name || !newGuest.email) return
    await supabase.from('guests').insert({ name: newGuest.name, email: newGuest.email, phone: newGuest.phone })
    setNewGuest({ name: '', email: '', phone: '' })
    reload()
  }

  async function removeGuest(id) {
    await supabase.from('guests').delete().eq('id', id)
    reload()
  }

  async function approveRequest(r) {
    await supabase.from('guests').insert({ name: r.plus_one_name, email: '', is_plus_one: true, note: `+1 for ${r.requested_by_name}` })
    await supabase.from('plus_one_requests').update({ status: 'approved' }).eq('id', r.id)
    reload()
  }

  async function denyRequest(r) {
    await supabase.from('plus_one_requests').update({ status: 'denied' }).eq('id', r.id)
    reload()
  }

  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)' }}>Admin panel</h2>

      <h3>Event details</h3>
      <form onSubmit={saveConfig} style={{ display: 'grid', gap: 12, marginBottom: 40 }}>
        <label style={labelStyle}>Date display text
          <input style={inputStyle} value={form.event_date_display || ''} onChange={(e) => setForm({ ...form, event_date_display: e.target.value })} />
        </label>
        <label style={labelStyle}>Date (ISO, for countdown)
          <input style={inputStyle} value={form.event_date_iso || ''} onChange={(e) => setForm({ ...form, event_date_iso: e.target.value })} placeholder="2027-06-19T18:00:00" />
        </label>
        <label style={labelStyle}>Venue name
          <input style={inputStyle} value={form.venue_name || ''} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
        </label>
        <label style={labelStyle}>Venue address
          <input style={inputStyle} value={form.venue_address || ''} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} />
        </label>
        <label style={labelStyle}>Doors time
          <input style={inputStyle} value={form.doors_time || ''} onChange={(e) => setForm({ ...form, doors_time: e.target.value })} />
        </label>
        <label style={labelStyle}>Photo album link
          <input style={inputStyle} value={form.photo_album_link || ''} onChange={(e) => setForm({ ...form, photo_album_link: e.target.value })} />
        </label>
        <button type="submit" style={primaryBtnStyle}>Save details</button>
        {savedMsg ? <p>{savedMsg}</p> : null}
      </form>

      <h3>Guest list ({guests.length})</h3>
      <form onSubmit={addGuest} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Name" style={inputStyle} value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} />
        <input placeholder="Email" style={inputStyle} value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} />
        <input placeholder="Phone (optional)" style={inputStyle} value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} />
        <button type="submit" style={primaryBtnStyle}>+ Add</button>
      </form>
      <div style={{ display: 'grid', gap: 8, marginBottom: 40 }}>
        {guests.map((g) => (
          <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
            <span>{g.name} — {STATUS_LABEL[g.rsvp_status]?.text} {g.email ? `(${g.email})` : ''}</span>
            <button onClick={() => removeGuest(g.id)} style={{ ...secondaryBtnStyle, padding: '4px 10px' }}>Remove</button>
          </div>
        ))}
      </div>

      <h3>+1 requests {pending.length ? `(${pending.length} pending)` : ''}</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {requests.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>No requests yet.</p>}
        {requests.map((r) => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
            <span>{r.requested_by_name} wants to bring <strong>{r.plus_one_name}</strong> — {r.status}</span>
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => approveRequest(r)} style={{ ...primaryBtnStyle, padding: '6px 12px' }}>Approve</button>
                <button onClick={() => denyRequest(r)} style={{ ...secondaryBtnStyle, padding: '6px 12px' }}>Deny</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-soft)', fontSize: 13 }}>
      <a href="#admin" style={{ color: 'var(--ink-soft)' }}>Admin</a>
    </footer>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(43,36,32,0.5)',
  display: 'grid', placeItems: 'center', padding: 20, zIndex: 50,
}
const modalStyle = {
  background: 'var(--white)', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%',
  position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
}
const closeBtnStyle = {
  position: 'absolute', top: 14, right: 16, border: 'none', background: 'none',
  fontSize: 24, cursor: 'pointer', color: 'var(--ink-soft)', lineHeight: 1,
}
const labelStyle = { display: 'grid', gap: 6, fontSize: 14, color: 'var(--ink-soft)', fontWeight: 600 }
const inputStyle = {
  padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)',
  fontSize: 15, fontFamily: 'var(--font-body)', color: 'var(--ink)',
}
const primaryBtnStyle = {
  background: 'var(--accent)', color: 'var(--white)', border: 'none', borderRadius: 999,
  padding: '12px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
const secondaryBtnStyle = {
  background: 'none', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 999,
  padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
}
const errorStyle = { color: '#B3261E', fontSize: 13, margin: 0 }
function pillBtn(active) {
  return {
    flex: 1, padding: '10px 14px', borderRadius: 999, cursor: 'pointer',
    border: active ? '1px solid var(--accent)' : '1px solid var(--line)',
    background: active ? 'var(--accent)' : 'var(--white)',
    color: active ? 'var(--white)' : 'var(--ink)', fontWeight: 600,
  }
}
