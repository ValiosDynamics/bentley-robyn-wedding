import { useState, useEffect, useMemo } from "react";

// ── Admin password ─────────────────────────────────────────────────────────
// Change this to whatever you want. Guests can't see source code when deployed.
const ADMIN_PASSWORD = "bestfriends4eva";

// ── Default config (overridden once you save from the admin panel) ─────────
const DEFAULT_CONFIG = {
  dateDisplay: "June 2027",
  dateISO:     "2027-06-19T17:00:00-07:00",
  venueName:   "Kelowna, BC",
  venueSub:    "Venue TBD — stay tuned",
  doorsTime:   "5:00 PM",
  photoLink:   "",
};

const EQ_BARS = Array.from({ length: 32 }, (_, i) => ({
  anim:  `eq${(i % 5) + 1}`,
  dur:   `${(0.65 + (i * 0.14) % 0.95).toFixed(2)}s`,
  delay: `${-((i * 0.21) % 1.5).toFixed(2)}s`,
}));

function getTimeLeft(isoDate) {
  const diff = new Date(isoDate) - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function buildPublicList(guests, rsvps) {
  const list = guests.map(g => {
    const match = rsvps.find(r =>
      r.name.trim().toLowerCase() === g.name.trim().toLowerCase()
    );
    return {
      id:     g.id,
      name:   g.name,
      status: match ? match.attending : "pending",
      guests: match?.guests || "1",
    };
  });
  rsvps.forEach(r => {
    const already = list.some(g =>
      g.name.trim().toLowerCase() === r.name.trim().toLowerCase()
    );
    if (!already) {
      list.push({ id: `rsvp-${r.name}`, name: r.name, status: r.attending, guests: r.guests });
    }
  });
  const order = { yes: 0, pending: 1, no: 2 };
  return list.sort((a, b) => (order[a.status] ?? 1) - (order[b.status] ?? 1));
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #FDFCFA; color: #1C1A22; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #FDFCFA; }
  ::-webkit-scrollbar-thumb { background: #FF6B35; border-radius: 3px; }

  @keyframes eq1 { 0%,100%{transform:scaleY(0.12)} 50%{transform:scaleY(0.9)} }
  @keyframes eq2 { 0%,100%{transform:scaleY(0.7)} 50%{transform:scaleY(0.2)} }
  @keyframes eq3 { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1.0)} }
  @keyframes eq4 { 0%,100%{transform:scaleY(0.8)} 50%{transform:scaleY(0.18)} }
  @keyframes eq5 { 0%,100%{transform:scaleY(0.22)} 50%{transform:scaleY(0.75)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bob   { 0%,100%{opacity:0.2} 50%{opacity:0.8} }
  .wu  { animation: fadeUp 0.75s ease both; }
  .wu1 { animation-delay: 0.05s; }
  .wu2 { animation-delay: 0.15s; }
  .wu3 { animation-delay: 0.25s; }
  .wu4 { animation-delay: 0.38s; }

  /* NAV */
  .wnav { position:fixed; top:0; left:0; right:0; z-index:100; padding:16px 40px; display:flex; justify-content:space-between; align-items:center; background:rgba(253,252,250,0.92); backdrop-filter:blur(16px); border-bottom:1px solid rgba(28,26,34,0.08); }
  .wnav-logo { font-family:'Fraunces',serif; font-size:22px; font-weight:700; font-style:italic; color:#FF6B35; cursor:pointer; }
  .wnav-links { display:flex; gap:28px; }
  .wnav-link { color:#9A98A4; font-size:12px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; background:none; border:none; padding:0; font-family:'Plus Jakarta Sans',sans-serif; transition:color 0.2s; }
  .wnav-link:hover { color:#FF6B35; }

  /* HERO */
  .hero { position:relative; min-height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:100px 24px 80px; overflow:hidden; background:#FFF8F0; }
  .hero-eq { position:absolute; bottom:0; left:0; right:0; height:50%; display:flex; align-items:flex-end; opacity:0.1; pointer-events:none; }
  .eq-b { flex:1; margin:0 1.5px; border-radius:3px 3px 0 0; transform-origin:bottom; background:#FF6B35; }
  .hero-eyebrow { font-family:'Fraunces',serif; font-size:21px; font-weight:300; font-style:italic; color:#FF6B35; margin-bottom:20px; position:relative; z-index:1; }
  .hero-title { font-family:'Fraunces',serif; font-size:clamp(64px,14vw,138px); font-weight:900; line-height:0.87; letter-spacing:-0.03em; color:#1C1A22; position:relative; z-index:1; }
  .amp { color:#FF6B35; font-style:italic; font-weight:300; }
  .hero-sub { margin-top:28px; font-size:13px; color:#9A98A4; letter-spacing:0.22em; text-transform:uppercase; font-weight:600; position:relative; z-index:1; }
  .cd-row { display:flex; gap:14px; margin-top:52px; position:relative; z-index:1; }
  .cd-box { background:white; border:1px solid rgba(28,26,34,0.1); border-radius:14px; padding:20px 24px; min-width:84px; text-align:center; box-shadow:0 2px 10px rgba(28,26,34,0.07); }
  .cd-num { font-family:'Fraunces',serif; font-size:clamp(28px,5vw,48px); font-weight:700; color:#FF6B35; line-height:1; font-variant-numeric:tabular-nums; }
  .cd-lbl { font-size:10px; color:#9A98A4; letter-spacing:0.14em; text-transform:uppercase; margin-top:9px; font-weight:600; }
  .cta { margin-top:44px; background:#FF6B35; color:white; border:none; border-radius:12px; padding:17px 46px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; letter-spacing:0.04em; transition:background 0.2s,transform 0.15s; position:relative; z-index:1; box-shadow:0 4px 18px rgba(255,107,53,0.32); }
  .cta:hover { background:#e55924; transform:translateY(-2px); }
  .cta:active { transform:translateY(0); }
  .scroll-hint { position:absolute; bottom:30px; left:50%; transform:translateX(-50%); font-size:20px; color:rgba(28,26,34,0.18); animation:bob 2.5s ease infinite; }

  /* SECTIONS */
  .wsec     { padding:110px 24px; background:#FDFCFA; }
  .wsec-alt { background:#F7F4EF; border-top:1px solid rgba(28,26,34,0.06); border-bottom:1px solid rgba(28,26,34,0.06); }
  .wsec-inner { max-width:1060px; margin:0 auto; }
  .eyebrow { font-family:'Fraunces',serif; font-size:20px; font-weight:300; font-style:italic; color:#FF6B35; margin-bottom:12px; }
  .sec-title { font-family:'Fraunces',serif; font-size:clamp(30px,5vw,50px); font-weight:700; line-height:1.1; margin-bottom:54px; color:#1C1A22; }
  .acc { color:#FF6B35; }

  /* VIBE */
  .vibe-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:16px; }
  .vibe-card { background:white; border:1px solid rgba(28,26,34,0.08); border-radius:18px; padding:36px 22px; text-align:center; transition:border-color 0.2s,transform 0.2s,box-shadow 0.2s; box-shadow:0 2px 8px rgba(28,26,34,0.04); }
  .vibe-card:hover { border-color:rgba(255,107,53,0.35); transform:translateY(-5px); box-shadow:0 10px 28px rgba(255,107,53,0.12); }
  .vibe-icon  { font-size:42px; margin-bottom:16px; display:block; }
  .vibe-title { font-family:'Fraunces',serif; font-size:19px; font-weight:700; margin-bottom:10px; }
  .vibe-body  { font-size:13.5px; color:#6B6975; line-height:1.65; }

  /* DETAILS */
  .detail-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(215px,1fr)); gap:18px; margin-bottom:18px; }
  .d-card { background:white; border:1px solid rgba(28,26,34,0.08); border-radius:16px; padding:26px 22px; box-shadow:0 2px 8px rgba(28,26,34,0.04); }
  .d-lbl { font-size:11px; color:#9A98A4; font-weight:600; letter-spacing:0.09em; text-transform:uppercase; margin-bottom:12px; }
  .d-val { font-family:'Fraunces',serif; font-size:26px; font-weight:700; margin-bottom:5px; }
  .d-sub { font-size:13px; color:#6B6975; }
  .d-note { background:rgba(255,107,53,0.06); border:1px solid rgba(255,107,53,0.18); border-radius:14px; padding:20px 22px; }

  /* PHOTO LINK */
  .photo-btn { display:inline-flex; align-items:center; gap:10px; background:#1C1A22; color:white; text-decoration:none; border-radius:12px; padding:18px 32px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; transition:background 0.2s,transform 0.15s; }
  .photo-btn:hover { background:#3C3A42; transform:translateY(-2px); }

  /* GUEST LIST */
  .gl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px; }
  .gl-item { background:white; border:1px solid rgba(28,26,34,0.08); border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(28,26,34,0.04); }
  .gl-name { font-size:14px; font-weight:600; color:#1C1A22; }
  .gl-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; white-space:nowrap; margin-left:8px; flex-shrink:0; }
  .gb-yes     { background:rgba(34,197,94,0.1); color:#16a34a; }
  .gb-no      { background:rgba(239,68,68,0.1); color:#dc2626; }
  .gb-pending { background:rgba(234,179,8,0.1); color:#ca8a04; }

  /* RSVP */
  .rsvp-wrap { max-width:570px; margin:0 auto; }
  .fg { margin-bottom:18px; }
  .flbl { display:block; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#9A98A4; margin-bottom:8px; }
  .fi,.fs,.fta { width:100%; background:white; border:1px solid rgba(28,26,34,0.12); border-radius:11px; padding:14px 16px; color:#1C1A22; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; outline:none; transition:border-color 0.2s; box-shadow:0 1px 4px rgba(28,26,34,0.05); }
  .fi:focus,.fs:focus,.fta:focus { border-color:#FF6B35; }
  .fi::placeholder,.fta::placeholder { color:#C4C2CC; }
  .fs option { background:white; color:#1C1A22; }
  .sub-btn { width:100%; background:#FF6B35; color:white; border:none; border-radius:11px; padding:17px; font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; font-weight:700; cursor:pointer; letter-spacing:0.04em; transition:background 0.2s,transform 0.15s; margin-top:6px; box-shadow:0 4px 16px rgba(255,107,53,0.28); }
  .sub-btn:hover { background:#e55924; transform:translateY(-2px); }
  .sub-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  .ok-box { background:rgba(255,107,53,0.06); border:1px solid rgba(255,107,53,0.22); border-radius:18px; padding:52px 32px; text-align:center; }
  .ok-icon  { font-size:50px; margin-bottom:16px; }
  .ok-title { font-family:'Fraunces',serif; font-size:30px; font-weight:700; margin-bottom:10px; }
  .ok-sub   { font-size:15px; color:#6B6975; }
  .ghost { background:transparent; border:1px solid rgba(28,26,34,0.15); border-radius:9px; padding:11px 26px; color:#6B6975; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; margin-top:22px; transition:border-color 0.2s,color 0.2s; }
  .ghost:hover { border-color:rgba(28,26,34,0.35); color:#1C1A22; }

  /* FOOTER */
  .wfooter { border-top:1px solid rgba(28,26,34,0.08); padding:48px 24px; text-align:center; background:#FDFCFA; }
  .wf-logo { font-family:'Fraunces',serif; font-size:30px; font-weight:700; font-style:italic; color:#FF6B35; margin-bottom:8px; }
  .wf-sub  { font-size:11px; color:#C4C2CC; letter-spacing:0.16em; text-transform:uppercase; }
  .admin-btn { background:none; border:none; font-size:11px; color:#D8D6E0; cursor:pointer; margin-top:24px; font-family:'Plus Jakarta Sans',sans-serif; letter-spacing:0.08em; text-transform:uppercase; transition:color 0.2s; }
  .admin-btn:hover { color:#9A98A4; }

  /* ADMIN — password gate */
  .pw-gate { min-height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#F7F4EF; padding:24px; text-align:center; }
  .pw-eyebrow { font-size:11px; color:#9A98A4; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:10px; }
  .pw-title { font-family:'Fraunces',serif; font-size:40px; font-weight:700; font-style:italic; color:#FF6B35; margin-bottom:8px; }
  .pw-sub   { color:#6B6975; margin-bottom:32px; font-size:15px; }
  .pw-row   { display:flex; gap:10px; width:100%; max-width:380px; }
  .pw-input { flex:1; background:white; border:1px solid rgba(28,26,34,0.12); border-radius:10px; padding:14px 16px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; outline:none; color:#1C1A22; transition:border-color 0.2s; box-shadow:0 1px 4px rgba(28,26,34,0.05); }
  .pw-input:focus { border-color:#FF6B35; }
  .pw-btn { background:#FF6B35; color:white; border:none; border-radius:10px; padding:14px 22px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; white-space:nowrap; box-shadow:0 3px 12px rgba(255,107,53,0.3); }
  .pw-error { color:#dc2626; font-size:13px; margin-top:12px; }
  .pw-back  { margin-top:28px; background:none; border:none; color:#9A98A4; cursor:pointer; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; }

  /* ADMIN — panel */
  .adm-bar { background:white; border-bottom:1px solid rgba(28,26,34,0.08); padding:16px 32px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:10; }
  .adm-bar-title { font-family:'Fraunces',serif; font-size:20px; font-weight:700; }
  .adm-bar-actions { display:flex; gap:10px; }
  .adm-back { background:none; border:1px solid rgba(28,26,34,0.15); border-radius:8px; padding:8px 16px; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; color:#6B6975; transition:all 0.2s; }
  .adm-back:hover { border-color:#FF6B35; color:#FF6B35; }
  .adm-logout { background:none; border:1px solid rgba(220,38,38,0.25); border-radius:8px; padding:8px 16px; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:600; color:#dc2626; }
  .adm-body  { background:#F7F4EF; min-height:100vh; padding:32px 24px 80px; }
  .adm-inner { max-width:760px; margin:0 auto; }
  .adm-card  { background:white; border:1px solid rgba(28,26,34,0.08); border-radius:16px; padding:28px; margin-bottom:20px; box-shadow:0 2px 8px rgba(28,26,34,0.05); }
  .adm-card h2 { font-family:'Fraunces',serif; font-size:19px; font-weight:700; margin-bottom:20px; }
  .adm-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .adm-save { background:#FF6B35; color:white; border:none; border-radius:10px; padding:14px 32px; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; margin-top:6px; box-shadow:0 3px 12px rgba(255,107,53,0.28); transition:background 0.2s; }
  .adm-save:hover { background:#e55924; }
  .saved-msg { color:#16a34a; font-size:13px; margin-top:10px; font-weight:600; }

  /* ADMIN — guest list manager */
  .add-row { display:flex; gap:10px; margin-bottom:16px; }
  .add-btn { background:#1C1A22; color:white; border:none; border-radius:10px; padding:0 20px; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:700; cursor:pointer; white-space:nowrap; transition:background 0.2s; }
  .add-btn:hover { background:#3C3A42; }
  .gt-empty { color:#9A98A4; font-size:13px; padding:8px 0; }
  .gt-row { display:flex; align-items:center; padding:10px 0; border-bottom:1px solid rgba(28,26,34,0.06); }
  .gt-name { flex:1; font-size:14px; font-weight:600; }
  .gt-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin-right:10px; }
  .st-yes     { background:rgba(34,197,94,0.1); color:#16a34a; }
  .st-no      { background:rgba(239,68,68,0.1); color:#dc2626; }
  .st-pending { background:rgba(234,179,8,0.1); color:#ca8a04; }
  .rm-btn { background:none; border:none; color:#dc2626; cursor:pointer; font-size:18px; padding:2px 8px; border-radius:6px; transition:background 0.2s; line-height:1; }
  .rm-btn:hover { background:rgba(239,68,68,0.1); }

  /* ADMIN — rsvp list */
  .adm-rsvp { background:#F7F4EF; border-radius:10px; padding:12px 16px; margin-bottom:8px; font-size:13px; }

  @media (max-width:640px) {
    .wnav { padding:13px 18px; }
    .wnav-links { gap:16px; }
    .wnav-link { font-size:10.5px; }
    .cd-box { min-width:58px; padding:13px 8px; }
    .wsec { padding:80px 18px; }
    .adm-grid2 { grid-template-columns:1fr; }
    .adm-bar { padding:14px 18px; }
    .pw-row { flex-direction:column; }
  }
`;

export default function App() {
  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  // ── View & auth ──────────────────────────────────────────────────────────
  const [view,    setView]    = useState("site");
  const [authed,  setAuthed]  = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  // ── Config ───────────────────────────────────────────────────────────────
  const [config,      setConfig]      = useState(DEFAULT_CONFIG);
  const [editConfig,  setEditConfig]  = useState(DEFAULT_CONFIG);
  const [configSaved, setConfigSaved] = useState(false);

  // ── Guests & RSVPs ───────────────────────────────────────────────────────
  const [guests,   setGuests]   = useState([]);
  const [newGuest, setNewGuest] = useState("");
  const [rsvps,    setRsvps]    = useState([]);

  // ── RSVP form ────────────────────────────────────────────────────────────
  const [form,    setForm]    = useState({ name: "", email: "", attending: "yes", guests: "1", note: "" });
  const [subDone, setSubDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Countdown ────────────────────────────────────────────────────────────
  const [tl, setTl] = useState(getTimeLeft(DEFAULT_CONFIG.dateISO));

  // ── Storage helpers ───────────────────────────────────────────────────────
  const STO_CFG  = "br-config";
  const STO_GST  = "br-guests";
  const STO_RSVP = "br-rsvps-2027";

  async function sGet(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  async function sSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.location.hash === "#admin") setView("admin");
    (async () => {
      const cfg = await sGet(STO_CFG);
      if (cfg) { setConfig(cfg); setEditConfig(cfg); setTl(getTimeLeft(cfg.dateISO)); }
      const gst = await sGet(STO_GST);
      if (gst) setGuests(gst);
      const rsp = await sGet(STO_RSVP);
      if (rsp) setRsvps(rsp);
    })();
    const t = setInterval(() => setTl(tl => getTimeLeft(config.dateISO)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setTl(getTimeLeft(config.dateISO)); }, [config.dateISO]);

  // ── Admin actions ─────────────────────────────────────────────────────────
  function handleLogin(e) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  }

  async function saveConfig() {
    await sSet(STO_CFG, editConfig);
    setConfig(editConfig);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  }

  async function addGuest() {
    const name = newGuest.trim();
    if (!name) return;
    const updated = [...guests, { id: Date.now().toString(), name }];
    setGuests(updated);
    setNewGuest("");
    await sSet(STO_GST, updated);
  }

  async function removeGuest(id) {
    const updated = guests.filter(g => g.id !== id);
    setGuests(updated);
    await sSet(STO_GST, updated);
  }

  // ── RSVP submit ───────────────────────────────────────────────────────────
  async function handleRsvp(e) {
    e.preventDefault();
    setLoading(true);
    const rsp = await sGet(STO_RSVP);
    const list = rsp || [];
    const updated = [...list, { ...form, ts: new Date().toLocaleString("en-CA") }];
    await sSet(STO_RSVP, updated);
    setRsvps(updated);
    setSubDone(true);
    setLoading(false);
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const publicList = useMemo(() => buildPublicList(guests, rsvps), [guests, rsvps]);
  const yesCount   = rsvps.filter(r => r.attending === "yes").length;
  const noCount    = rsvps.filter(r => r.attending === "no").length;
  const totalGuests = rsvps.filter(r => r.attending === "yes")
                           .reduce((s, r) => s + parseInt(r.guests || 1), 0);

  // ── Admin nav helpers ─────────────────────────────────────────────────────
  function goAdmin() { setView("admin"); window.location.hash = "admin"; }
  function goSite()  { setView("site");  window.location.hash = "";      }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN — password gate
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "admin" && !authed) return (
    <>
      <style>{STYLES}</style>
      <div className="pw-gate">
        <p className="pw-eyebrow">Wedding Admin</p>
        <h1 className="pw-title">B &amp; R</h1>
        <p className="pw-sub">Enter the password to continue.</p>
        <form className="pw-row" onSubmit={handleLogin}>
          <input className="pw-input" type="password" placeholder="Password" autoFocus
            value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }} />
          <button type="submit" className="pw-btn">Unlock →</button>
        </form>
        {pwError && <p className="pw-error">Wrong password — try again.</p>}
        <button className="pw-back" onClick={goSite}>← Back to site</button>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN — panel
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "admin" && authed) return (
    <>
      <style>{STYLES}</style>
      <div>
        <div className="adm-bar">
          <span className="adm-bar-title">Admin Panel</span>
          <div className="adm-bar-actions">
            <button className="adm-back" onClick={goSite}>← View Site</button>
            <button className="adm-logout" onClick={() => { setAuthed(false); setPwInput(""); }}>Log out</button>
          </div>
        </div>

        <div className="adm-body">
          <div className="adm-inner">

            {/* ── Site Details ── */}
            <div className="adm-card">
              <h2>Site Details</h2>
              <div className="adm-grid2">
                {[
                  ["Date (shown on site)",    "dateDisplay", "e.g. June 19, 2027"],
                  ["Date (countdown ISO)",    "dateISO",     "e.g. 2027-06-19T17:00:00-07:00"],
                  ["Venue Name",              "venueName",   "e.g. Rutland Centennial Hall"],
                  ["Venue Address / Tagline", "venueSub",    "e.g. 765 Doyle Ave, Kelowna"],
                  ["Doors Time",             "doorsTime",   "e.g. 5:00 PM"],
                  ["Photo Album Link",        "photoLink",   "https://photos.google.com/..."],
                ].map(([label, key, ph]) => (
                  <div key={key} className="fg">
                    <label className="flbl">{label}</label>
                    <input className="fi" placeholder={ph}
                      value={editConfig[key]}
                      onChange={e => setEditConfig({ ...editConfig, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button className="adm-save" onClick={saveConfig}>Save Changes</button>
              {configSaved && <p className="saved-msg">✓ Saved and live!</p>}
            </div>

            {/* ── Guest List ── */}
            <div className="adm-card">
              <h2>Guest List — {guests.length} invited</h2>
              <div className="add-row">
                <input className="fi" placeholder="Full name..."
                  value={newGuest}
                  onChange={e => setNewGuest(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }} />
                <button className="add-btn" onClick={addGuest}>+ Add</button>
              </div>
              {guests.length === 0 && <p className="gt-empty">No guests added yet. Add them above and they'll appear on the public guest list as ⏳ Pending until they RSVP.</p>}
              {guests.map(g => {
                const match  = rsvps.find(r => r.name.trim().toLowerCase() === g.name.trim().toLowerCase());
                const status = match ? match.attending : "pending";
                return (
                  <div key={g.id} className="gt-row">
                    <span className="gt-name">{g.name}</span>
                    <span className={`gt-badge ${status === "yes" ? "st-yes" : status === "no" ? "st-no" : "st-pending"}`}>
                      {status === "yes" ? `✓ Coming (+${match?.guests})` : status === "no" ? "✗ Can't make it" : "⏳ Pending"}
                    </span>
                    <button className="rm-btn" onClick={() => removeGuest(g.id)} title="Remove guest">×</button>
                  </div>
                );
              })}
            </div>

            {/* ── RSVPs received ── */}
            <div className="adm-card">
              <h2>RSVPs — {yesCount} coming · {totalGuests} total guests · {noCount} can't make it</h2>
              {rsvps.length === 0 && <p className="gt-empty">No RSVPs yet.</p>}
              {rsvps.map((r, i) => (
                <div key={i} className="adm-rsvp">
                  <strong>{r.name}</strong>
                  <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: r.attending === "yes" ? "#16a34a" : "#dc2626" }}>
                    {r.attending === "yes" ? `✓ Coming (+${r.guests})` : "✗ Can't make it"}
                  </span>
                  <span style={{ marginLeft: 10, color: "#9A98A4", fontSize: 12 }}>{r.email}</span>
                  {r.note && <p style={{ color: "#6B6975", fontSize: 12, fontStyle: "italic", marginTop: 4 }}>"{r.note}"</p>}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN SITE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      {/* NAV */}
      <nav className="wnav">
        <span className="wnav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>B &amp; R</span>
        <div className="wnav-links">
          <button className="wnav-link" onClick={() => go("vibe")}>The Vibe</button>
          <button className="wnav-link" onClick={() => go("details")}>Details</button>
          {publicList.length > 0 && <button className="wnav-link" onClick={() => go("guestlist")}>Guest List</button>}
          <button className="wnav-link" onClick={() => go("rsvp")}>RSVP</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="hero">
        <div className="hero-eq">
          {EQ_BARS.map((b, i) => (
            <div key={i} className="eq-b"
              style={{ animation: `${b.anim} ${b.dur} ${b.delay} ease-in-out infinite` }} />
          ))}
        </div>
        <p className="hero-eyebrow wu">best friends 4 eva 💛</p>
        <h1 className="hero-title wu wu1">BENTLEY<br /><span className="amp">&amp;</span><br />ROBYN</h1>
        <p className="hero-sub wu wu2">{config.dateDisplay} &nbsp;·&nbsp; {config.venueName}</p>
        <div className="cd-row wu wu3">
          {[["days", tl.days], ["hours", tl.hours], ["mins", tl.minutes], ["secs", tl.seconds]].map(([lbl, val]) => (
            <div key={lbl} className="cd-box">
              <div className="cd-num">{String(val).padStart(2, "0")}</div>
              <div className="cd-lbl">{lbl}</div>
            </div>
          ))}
        </div>
        <button className="cta wu wu4" onClick={() => go("rsvp")}>Count me in →</button>
        <div className="scroll-hint">↓</div>
      </section>

      {/* VIBE */}
      <section id="vibe" className="wsec">
        <div className="wsec-inner">
          <p className="eyebrow">what to expect</p>
          <h2 className="sec-title">We're keeping it exactly<br /><span className="acc">what it is.</span></h2>
          <div className="vibe-grid">
            {[
              { icon: "🕺", title: "Dancing",    body: "Music from the moment doors open. Spotify, a request tablet, and a floor that IS the event. Come ready to move." },
              { icon: "🍕", title: "Good Eats",  body: "A proper spread of things you actually want to eat standing up. No sit-down dinner, no formalities." },
              { icon: "🍺", title: "Drinks",     body: "Toonie bar. Beer, wine, seltzers. Simple, social, sorted." },
              { icon: "💛", title: "Each Other", body: "No lengthy speeches, no stuffy rituals. Just our favourite people in one room having an actual good time." },
            ].map(c => (
              <div key={c.title} className="vibe-card">
                <span className="vibe-icon">{c.icon}</span>
                <div className="vibe-title">{c.title}</div>
                <div className="vibe-body">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILS */}
      <section id="details" className="wsec wsec-alt">
        <div className="wsec-inner">
          <p className="eyebrow">the details</p>
          <h2 className="sec-title">Save the date.</h2>
          <div className="detail-grid">
            {[
              { lbl: "📅 When",  val: config.dateDisplay, sub: "Saturday — confirmed once the hall is locked" },
              { lbl: "📍 Where", val: config.venueName,   sub: config.venueSub },
              { lbl: "⏰ Doors", val: config.doorsTime,   sub: "Come ready to dance" },
            ].map(d => (
              <div key={d.lbl} className="d-card">
                <div className="d-lbl">{d.lbl}</div>
                <div className="d-val">{d.val}</div>
                <div className="d-sub">{d.sub}</div>
              </div>
            ))}
          </div>
          <div className="d-note">
            <p style={{ fontSize: 14, color: "#6B6975", lineHeight: 1.75 }}>
              <span style={{ color: "#D97316", fontWeight: 700 }}>Dress code:</span>{" "}
              Whatever you want to dance in. Nice casual is the vibe — leave the heels at home if you actually plan to move.
            </p>
          </div>
        </div>
      </section>

      {/* PHOTOS */}
      {config.photoLink && (
        <section id="photos" className="wsec">
          <div className="wsec-inner">
            <p className="eyebrow">photos</p>
            <h2 className="sec-title">Captured moments.</h2>
            <a href={config.photoLink} target="_blank" rel="noopener noreferrer" className="photo-btn">
              📸 View the Album →
            </a>
          </div>
        </section>
      )}

      {/* GUEST LIST */}
      {publicList.length > 0 && (
        <section id="guestlist" className="wsec wsec-alt">
          <div className="wsec-inner">
            <p className="eyebrow">who's coming</p>
            <h2 className="sec-title">The guest list.</h2>
            <div className="gl-grid">
              {publicList.map((g, i) => (
                <div key={g.id || i} className="gl-item">
                  <span className="gl-name">{g.name}</span>
                  <span className={`gl-badge ${g.status === "yes" ? "gb-yes" : g.status === "no" ? "gb-no" : "gb-pending"}`}>
                    {g.status === "yes" ? "💃 Coming" : g.status === "no" ? "🥺 Can't make it" : "⏳ Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RSVP */}
      <section id="rsvp" className="wsec">
        <div className="rsvp-wrap">
          <p className="eyebrow">are you in?</p>
          <h2 className="sec-title">RSVP</h2>
          {subDone ? (
            <div className="ok-box">
              <div className="ok-icon">🎉</div>
              <div className="ok-title">You're on the list.</div>
              <div className="ok-sub">{form.attending === "yes" ? "Can't wait to dance with you." : "We'll miss you, but we love you."}</div>
              <button className="ghost" onClick={() => { setSubDone(false); setForm({ name: "", email: "", attending: "yes", guests: "1", note: "" }); }}>
                Submit another RSVP
              </button>
            </div>
          ) : (
            <form onSubmit={handleRsvp}>
              <div className="fg">
                <label className="flbl">Your Name</label>
                <input required className="fi" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="fg">
                <label className="flbl">Email</label>
                <input required type="email" className="fi" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="fg">
                <label className="flbl">Can you make it?</label>
                <select className="fs" value={form.attending} onChange={e => setForm({ ...form, attending: e.target.value })}>
                  <option value="yes">🕺 Hell yes, I'm coming</option>
                  <option value="no">😢 Can't make it this time</option>
                </select>
              </div>
              {form.attending === "yes" && (
                <div className="fg">
                  <label className="flbl">Guests (including yourself)</label>
                  <select className="fs" value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}>
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              )}
              <div className="fg">
                <label className="flbl">Note (optional)</label>
                <textarea className="fta" placeholder="Say something nice..." rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
              <button type="submit" className="sub-btn" disabled={loading}>{loading ? "Sending..." : "Send it →"}</button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="wfooter">
        <div className="wf-logo">Bentley &amp; Robyn</div>
        <div className="wf-sub">June 2027 · Kelowna, BC · best friends 4 eva</div>
        <button className="admin-btn" onClick={goAdmin}>Admin</button>
      </footer>
    </>
  );
}
