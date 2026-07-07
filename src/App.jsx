import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ─── Utilities ────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }
function tLeft(iso) {
  const d = new Date(iso) - Date.now();
  if (d <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return { days: Math.floor(d/86400000), hours: Math.floor(d%86400000/3600000), minutes: Math.floor(d%3600000/60000), seconds: Math.floor(d%60000/1000) };
}

const EQ = Array.from({ length: 32 }, (_, i) => ({
  a: `eq${(i%5)+1}`, d: `${(0.65+(i*0.14)%0.95).toFixed(2)}s`, dl: `${-((i*0.21)%1.5).toFixed(2)}s`
}));

const DEF_CFG = {
  event_date_display: "June 2027", event_date_iso: "2027-06-19T17:00:00-07:00",
  venue_name: "Kelowna, BC", venue_address: "Venue TBD — stay tuned",
  doors_time: "5:00 PM", photo_album_link: "", guest_password: "dancefloor2027", admin_password: "bestfriends4eva",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;0,9..144,900;1,9..144,300&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#FDFCFA;color:#1C1A22;overflow-x:hidden;}
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#FDFCFA;} ::-webkit-scrollbar-thumb{background:#FF6B35;border-radius:3px;}

  @keyframes eq1{0%,100%{transform:scaleY(0.12)}50%{transform:scaleY(0.9)}}
  @keyframes eq2{0%,100%{transform:scaleY(0.7)}50%{transform:scaleY(0.2)}}
  @keyframes eq3{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1.0)}}
  @keyframes eq4{0%,100%{transform:scaleY(0.8)}50%{transform:scaleY(0.18)}}
  @keyframes eq5{0%,100%{transform:scaleY(0.22)}50%{transform:scaleY(0.75)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes bob{0%,100%{opacity:0.2}50%{opacity:0.8}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .wu{animation:fadeUp .75s ease both;} .wu1{animation-delay:.05s;} .wu2{animation-delay:.15s;} .wu3{animation-delay:.25s;} .wu4{animation-delay:.38s;}

  .wnav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 40px;display:flex;justify-content:space-between;align-items:center;background:rgba(253,252,250,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(28,26,34,.08);}
  .wnav-logo{font-family:'Fraunces',serif;font-size:22px;font-weight:700;font-style:italic;color:#FF6B35;cursor:pointer;}
  .wnav-links{display:flex;gap:28px;}
  .wnl{color:#9A98A4;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;background:none;border:none;padding:0;font-family:'Plus Jakarta Sans',sans-serif;transition:color .2s;}
  .wnl:hover{color:#FF6B35;}

  .hero{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:100px 24px 80px;overflow:hidden;background:#FFF8F0;}
  .hero-eq{position:absolute;bottom:0;left:0;right:0;height:50%;display:flex;align-items:flex-end;opacity:.1;pointer-events:none;}
  .eq-b{flex:1;margin:0 1.5px;border-radius:3px 3px 0 0;transform-origin:bottom;background:#FF6B35;}
  .hero-ey{font-family:'Fraunces',serif;font-size:21px;font-weight:300;font-style:italic;color:#FF6B35;margin-bottom:20px;position:relative;z-index:1;}
  .hero-t{font-family:'Fraunces',serif;font-size:clamp(64px,14vw,138px);font-weight:900;line-height:.87;letter-spacing:-.03em;color:#1C1A22;position:relative;z-index:1;}
  .amp{color:#FF6B35;font-style:italic;font-weight:300;}
  .hero-s{margin-top:28px;font-size:13px;color:#9A98A4;letter-spacing:.22em;text-transform:uppercase;font-weight:600;position:relative;z-index:1;}
  .cd-row{display:flex;gap:14px;margin-top:52px;position:relative;z-index:1;}
  .cd-box{background:white;border:1px solid rgba(28,26,34,.1);border-radius:14px;padding:20px 24px;min-width:84px;text-align:center;box-shadow:0 2px 10px rgba(28,26,34,.07);}
  .cd-n{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,48px);font-weight:700;color:#FF6B35;line-height:1;font-variant-numeric:tabular-nums;}
  .cd-l{font-size:10px;color:#9A98A4;letter-spacing:.14em;text-transform:uppercase;margin-top:9px;font-weight:600;}
  .cta{margin-top:44px;background:#FF6B35;color:white;border:none;border-radius:12px;padding:17px 46px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:.04em;transition:background .2s,transform .15s;position:relative;z-index:1;box-shadow:0 4px 18px rgba(255,107,53,.32);}
  .cta:hover{background:#e55924;transform:translateY(-2px);}
  .sh{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);font-size:20px;color:rgba(28,26,34,.18);animation:bob 2.5s ease infinite;}

  .wsec{padding:110px 24px;background:#FDFCFA;}
  .wsec-alt{background:#F7F4EF;border-top:1px solid rgba(28,26,34,.06);border-bottom:1px solid rgba(28,26,34,.06);}
  .wi{max-width:1060px;margin:0 auto;}
  .ey{font-family:'Fraunces',serif;font-size:20px;font-weight:300;font-style:italic;color:#FF6B35;margin-bottom:12px;}
  .st{font-family:'Fraunces',serif;font-size:clamp(30px,5vw,50px);font-weight:700;line-height:1.1;margin-bottom:54px;}
  .acc{color:#FF6B35;}

  .vibe-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;}
  .vc{background:white;border:1px solid rgba(28,26,34,.08);border-radius:18px;padding:36px 22px;text-align:center;transition:border-color .2s,transform .2s,box-shadow .2s;box-shadow:0 2px 8px rgba(28,26,34,.04);}
  .vc:hover{border-color:rgba(255,107,53,.35);transform:translateY(-5px);box-shadow:0 10px 28px rgba(255,107,53,.12);}
  .vi{font-size:42px;margin-bottom:16px;display:block;}
  .vt{font-family:'Fraunces',serif;font-size:19px;font-weight:700;margin-bottom:10px;}
  .vb{font-size:13.5px;color:#6B6975;line-height:1.65;}

  .dg{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:18px;margin-bottom:18px;}
  .dc{background:white;border:1px solid rgba(28,26,34,.08);border-radius:16px;padding:26px 22px;box-shadow:0 2px 8px rgba(28,26,34,.04);}
  .dl{font-size:11px;color:#9A98A4;font-weight:600;letter-spacing:.09em;text-transform:uppercase;margin-bottom:12px;}
  .dv{font-family:'Fraunces',serif;font-size:26px;font-weight:700;margin-bottom:5px;}
  .ds{font-size:13px;color:#6B6975;}
  .dn{background:rgba(255,107,53,.06);border:1px solid rgba(255,107,53,.18);border-radius:14px;padding:20px 22px;}

  .photo-btn{display:inline-flex;align-items:center;gap:10px;background:#1C1A22;color:white;text-decoration:none;border-radius:12px;padding:18px 32px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;transition:background .2s,transform .15s;}
  .photo-btn:hover{background:#3C3A42;transform:translateY(-2px);}

  .gl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
  .gl-card{background:white;border:1px solid rgba(28,26,34,.08);border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(28,26,34,.04);gap:10px;}
  .gl-name{font-size:14px;font-weight:600;color:#1C1A22;flex:1;}
  .gl-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0;}
  .gb-y{background:rgba(34,197,94,.1);color:#16a34a;}
  .gb-n{background:rgba(239,68,68,.1);color:#dc2626;}
  .gb-p{background:rgba(234,179,8,.1);color:#ca8a04;}
  .rsvp-btn{background:none;border:1px solid rgba(28,26,34,.15);border-radius:8px;padding:7px 14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s;color:#1C1A22;}
  .rsvp-btn:hover{background:#FF6B35;border-color:#FF6B35;color:white;}
  .rsvp-btn-done{background:none;border:none;padding:7px 0;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;cursor:pointer;color:#9A98A4;flex-shrink:0;}
  .rsvp-btn-done:hover{color:#FF6B35;}

  .mo{position:fixed;inset:0;z-index:1000;background:rgba(28,26,34,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;}
  .mb{background:white;border-radius:20px;padding:40px 36px;max-width:480px;width:100%;position:relative;box-shadow:0 20px 60px rgba(28,26,34,.25);max-height:90vh;overflow-y:auto;}
  .mc{position:absolute;top:14px;right:14px;background:none;border:none;font-size:22px;cursor:pointer;color:#9A98A4;padding:4px 8px;border-radius:6px;line-height:1;transition:background .2s;}
  .mc:hover{background:#F7F4EF;}
  .mt{font-family:'Fraunces',serif;font-size:24px;font-weight:700;margin-bottom:6px;}
  .ms{font-size:14px;color:#6B6975;margin-bottom:28px;line-height:1.5;}
  .mdone{text-align:center;padding:10px 0;}
  .mdone-i{font-size:48px;margin-bottom:16px;}
  .mdone-t{font-family:'Fraunces',serif;font-size:26px;font-weight:700;margin-bottom:8px;}
  .mdone-s{font-size:15px;color:#6B6975;}

  .fg{margin-bottom:18px;}
  .fl{display:block;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9A98A4;margin-bottom:8px;}
  .fi,.fs,.fta{width:100%;background:white;border:1px solid rgba(28,26,34,.12);border-radius:11px;padding:14px 16px;color:#1C1A22;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;outline:none;transition:border-color .2s;box-shadow:0 1px 4px rgba(28,26,34,.05);}
  .fi:focus,.fs:focus,.fta:focus{border-color:#FF6B35;}
  .fi::placeholder,.fta::placeholder{color:#C4C2CC;}

  .att-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px;}
  .att-btn{border:1px solid rgba(28,26,34,.15);border-radius:10px;padding:14px;text-align:center;cursor:pointer;background:white;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:600;transition:all .2s;}
  .att-y.active{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.5);color:#16a34a;}
  .att-n.active{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.5);color:#dc2626;}

  .p1-section{margin-top:20px;padding-top:20px;border-top:1px solid rgba(28,26,34,.06);}
  .p1-toggle{background:none;border:1px dashed rgba(28,26,34,.2);border-radius:10px;padding:12px 20px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:600;color:#6B6975;cursor:pointer;width:100%;text-align:center;transition:all .2s;margin-bottom:12px;}
  .p1-toggle:hover{border-color:#FF6B35;color:#FF6B35;}
  .p1-toggle.active{border-style:solid;border-color:#FF6B35;color:#FF6B35;background:rgba(255,107,53,.04);}

  .btn-primary{width:100%;background:#FF6B35;color:white;border:none;border-radius:11px;padding:17px;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;letter-spacing:.04em;transition:background .2s,transform .15s;margin-top:8px;box-shadow:0 4px 16px rgba(255,107,53,.28);}
  .btn-primary:hover{background:#e55924;transform:translateY(-2px);}
  .btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none;}
  .btn-ghost{background:transparent;border:1px solid rgba(28,26,34,.15);border-radius:9px;padding:11px 26px;color:#6B6975;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;margin-top:16px;transition:all .2s;}
  .btn-ghost:hover{border-color:rgba(28,26,34,.35);color:#1C1A22;}

  .wfooter{border-top:1px solid rgba(28,26,34,.08);padding:48px 24px;text-align:center;background:#FDFCFA;}
  .wf-logo{font-family:'Fraunces',serif;font-size:30px;font-weight:700;font-style:italic;color:#FF6B35;margin-bottom:8px;}
  .wf-sub{font-size:11px;color:#C4C2CC;letter-spacing:.16em;text-transform:uppercase;}
  .adm-link{background:none;border:none;font-size:11px;color:#E0DEE8;cursor:pointer;margin-top:24px;font-family:'Plus Jakarta Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase;transition:color .2s;}
  .adm-link:hover{color:#9A98A4;}

  .load-screen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#FDFCFA;gap:20px;}
  .load-logo{font-family:'Fraunces',serif;font-size:48px;font-weight:700;font-style:italic;color:#FF6B35;}
  .load-spin{width:24px;height:24px;border:2px solid rgba(255,107,53,.2);border-top-color:#FF6B35;border-radius:50%;animation:spin .8s linear infinite;}

  .pw-gate{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#F7F4EF;padding:24px;text-align:center;}
  .pw-ey{font-size:11px;color:#9A98A4;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px;}
  .pw-t{font-family:'Fraunces',serif;font-size:40px;font-weight:700;font-style:italic;color:#FF6B35;margin-bottom:6px;}
  .pw-s{color:#6B6975;margin-bottom:32px;font-size:15px;}
  .pw-row{display:flex;gap:10px;width:100%;max-width:380px;}
  .pw-i{flex:1;background:white;border:1px solid rgba(28,26,34,.12);border-radius:10px;padding:14px 16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;outline:none;color:#1C1A22;transition:border-color .2s;box-shadow:0 1px 4px rgba(28,26,34,.05);}
  .pw-i:focus{border-color:#FF6B35;}
  .pw-btn{background:#FF6B35;color:white;border:none;border-radius:10px;padding:14px 22px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 3px 12px rgba(255,107,53,.3);}
  .pw-err{color:#dc2626;font-size:13px;margin-top:12px;}
  .pw-back{margin-top:24px;background:none;border:none;color:#9A98A4;cursor:pointer;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;}

  .adm-bar{background:white;border-bottom:1px solid rgba(28,26,34,.08);padding:16px 32px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10;}
  .adm-bar-t{font-family:'Fraunces',serif;font-size:20px;font-weight:700;}
  .adm-acts{display:flex;gap:10px;}
  .adm-back{background:none;border:1px solid rgba(28,26,34,.15);border-radius:8px;padding:8px 16px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;color:#6B6975;transition:all .2s;}
  .adm-back:hover{border-color:#FF6B35;color:#FF6B35;}
  .adm-out{background:none;border:1px solid rgba(220,38,38,.25);border-radius:8px;padding:8px 16px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;color:#dc2626;}
  .adm-body{background:#F7F4EF;min-height:100vh;padding:32px 24px 80px;}
  .adm-inner{max-width:760px;margin:0 auto;}
  .adm-card{background:white;border:1px solid rgba(28,26,34,.08);border-radius:16px;padding:28px;margin-bottom:20px;box-shadow:0 2px 8px rgba(28,26,34,.05);}
  .adm-card h2{font-family:'Fraunces',serif;font-size:19px;font-weight:700;margin-bottom:20px;}
  .adm-g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .adm-save{background:#FF6B35;color:white;border:none;border-radius:10px;padding:14px 32px;font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px;box-shadow:0 3px 12px rgba(255,107,53,.28);transition:background .2s;}
  .adm-save:hover{background:#e55924;}
  .saved{color:#16a34a;font-size:13px;margin-top:10px;font-weight:600;}
  .add-row{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
  .add-btn{background:#1C1A22;color:white;border:none;border-radius:10px;padding:0 20px;font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background .2s;}
  .add-btn:hover{background:#3C3A42;}
  .gt-row{display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(28,26,34,.06);gap:8px;flex-wrap:wrap;}
  .gt-n{flex:1;font-size:14px;font-weight:600;}
  .gt-b{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-right:10px;}
  .st-y{background:rgba(34,197,94,.1);color:#16a34a;}
  .st-n{background:rgba(239,68,68,.1);color:#dc2626;}
  .st-p{background:rgba(234,179,8,.1);color:#ca8a04;}
  .rm-btn{background:none;border:none;color:#dc2626;cursor:pointer;font-size:18px;padding:2px 8px;border-radius:6px;transition:background .2s;line-height:1;}
  .rm-btn:hover{background:rgba(239,68,68,.1);}
  .p1-row{background:#F7F4EF;border-radius:12px;padding:14px 18px;margin-bottom:10px;}
  .p1-row-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
  .p1-meta{font-size:13px;color:#6B6975;margin-top:4px;}
  .p1-acts{display:flex;gap:8px;flex-shrink:0;}
  .p1-approve{background:#16a34a;color:white;border:none;border-radius:8px;padding:7px 14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;cursor:pointer;}
  .p1-deny{background:none;border:1px solid rgba(220,38,38,.3);color:#dc2626;border-radius:8px;padding:7px 14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;cursor:pointer;}
  .adm-empty{color:#9A98A4;font-size:13px;padding:8px 0;}

  .drop{border:2px dashed rgba(255,107,53,.4);border-radius:18px;padding:44px 24px;text-align:center;cursor:pointer;background:rgba(255,107,53,.04);transition:all .2s;}
  .drop:hover{background:rgba(255,107,53,.08);border-color:#FF6B35;}
  .drop-icon{font-size:36px;margin-bottom:12px;}
  .drop-t{font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:700;color:#1C1A22;margin-bottom:4px;}
  .drop-s{font-size:13px;color:#9A98A4;}
  .up-status{margin-top:16px;font-size:13px;color:#6B6975;text-align:center;}
  .up-status.ok{color:#16a34a;font-weight:600;}
  .up-status.err{color:#dc2626;font-weight:600;}
  .pg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:32px;}
  .pg-item{aspect-ratio:1;border-radius:12px;overflow:hidden;background:#F0ECE2;position:relative;box-shadow:0 2px 8px rgba(28,26,34,.06);}
  .pg-item img,.pg-item video{width:100%;height:100%;object-fit:cover;display:block;}
  .pg-empty{text-align:center;color:#9A98A4;font-size:14px;padding:20px 0;}

  @media(max-width:640px){
    .wnav{padding:13px 18px;} .wnav-links{gap:16px;} .wnl{font-size:10.5px;}
    .cd-box{min-width:58px;padding:13px 8px;} .wsec{padding:80px 18px;}
    .adm-g2{grid-template-columns:1fr;} .adm-bar{padding:14px 18px;}
    .pw-row{flex-direction:column;} .mb{padding:28px 22px;}
  }
`;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(window.location.hash === "#admin" ? "admin" : "site");
  const [authed, setAuthed] = useState(false);
  const [cfg, setCfg] = useState(DEF_CFG);
  const [editCfg, setEditCfg] = useState(DEF_CFG);
  const [guests, setGuests] = useState([]);
  const [plusReqs, setPlusReqs] = useState([]);
  const [tl, setTl] = useState(tLeft(DEF_CFG.event_date_iso));

  const [pwIn, setPwIn] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: "", email: "", phone: "" });
  const [cfgSaved, setCfgSaved] = useState(false);

  const [modal, setModal] = useState(null);
  const [mStep, setMStep] = useState("pw"); // pw | form | done
  const [mPw, setMPw] = useState("");
  const [mPwErr, setMPwErr] = useState(false);
  const [mForm, setMForm] = useState({ email: "", phone: "", attending: "coming", note: "" });
  const [wantP1, setWantP1] = useState(false);
  const [p1Name, setP1Name] = useState("");
  const [mLoading, setMLoading] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null); // {type:'ok'|'err', text}

  async function loadPhotos() {
    const { data, error } = await supabase.storage.from("wedding-photos").list("", { sortBy: { column: "created_at", order: "desc" } });
    if (error || !data) return;
    const withUrls = data
      .filter(f => f.name !== ".emptyFolderPlaceholder")
      .map(f => ({ name: f.name, url: supabase.storage.from("wedding-photos").getPublicUrl(f.name).data.publicUrl }));
    setPhotos(withUrls);
  }

  async function handlePhotoUpload(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    let okCount = 0;
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("wedding-photos").upload(path, file);
      if (!error) okCount++;
    }
    setUploading(false);
    if (okCount === files.length) setUploadMsg({ type: "ok", text: `${okCount} photo${okCount > 1 ? "s" : ""} uploaded — thank you! 💛` });
    else if (okCount > 0) setUploadMsg({ type: "err", text: `${okCount} of ${files.length} uploaded — a few failed, try again?` });
    else setUploadMsg({ type: "err", text: "Upload failed — try again, or check your connection." });
    loadPhotos();
  }

  useEffect(() => {
    loadAll();
    loadPhotos();
    const t = setInterval(() => setTl(tLeft(cfg.event_date_iso)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => setTl(tLeft(cfg.event_date_iso)), [cfg.event_date_iso]);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ data: c }, { data: g }, { data: p }] = await Promise.all([
        supabase.from("config").select("*").eq("id", 1).single(),
        supabase.from("guests").select("*").order("name"),
        supabase.from("plus_one_requests").select("*").order("created_at", { ascending: false }),
      ]);
      if (c) { setCfg(c); setEditCfg(c); setTl(tLeft(c.event_date_iso)); }
      setGuests(g || []);
      setPlusReqs(p || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    if (pwIn === cfg.admin_password) { setAuthed(true); setPwErr(false); }
    else setPwErr(true);
  }

  async function saveConfig() {
    const { id, ...data } = editCfg;
    await supabase.from("config").update(data).eq("id", 1);
    setCfg(editCfg);
    setCfgSaved(true);
    setTimeout(() => setCfgSaved(false), 2500);
  }

  async function addGuest() {
    const name = newGuest.name.trim();
    if (!name) return;
    const { data } = await supabase.from("guests").insert({
      name,
      email: newGuest.email.trim() || "",
      phone: newGuest.phone.trim() || null,
    }).select().single();
    if (data) setGuests(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewGuest({ name: "", email: "", phone: "" });
  }

  async function removeGuest(id) {
    await supabase.from("guests").delete().eq("id", id);
    setGuests(prev => prev.filter(g => g.id !== id));
  }

  async function approvePlusOne(req) {
    const { data } = await supabase.from("guests").insert({ name: req.plus_one_name, email: "", is_plus_one: true, note: `+1 for ${req.requested_by_name}` }).select().single();
    if (data) setGuests(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    await supabase.from("plus_one_requests").update({ status: "approved" }).eq("id", req.id);
    setPlusReqs(prev => prev.filter(r => r.id !== req.id));
  }

  async function denyPlusOne(id) {
    await supabase.from("plus_one_requests").update({ status: "denied" }).eq("id", id);
    setPlusReqs(prev => prev.filter(r => r.id !== id));
  }

  function openModal(guest) {
    setModal(guest);
    setMStep("pw");
    setMPw(""); setMPwErr(false);
    setMForm({ email: guest.email || "", phone: guest.phone || "", attending: guest.rsvp_status === "not_coming" ? "not_coming" : "coming", note: guest.note || "" });
    setWantP1(false); setP1Name("");
    setMLoading(false);
  }

  function handleMPw(e) {
    e.preventDefault();
    if (mPw === cfg.guest_password) { setMPwErr(false); setMStep("form"); }
    else setMPwErr(true);
  }

  async function handleRsvpSubmit(e) {
    e.preventDefault();
    setMLoading(true);
    try {
      await supabase.from("guests").update({
        rsvp_status: mForm.attending, email: mForm.email, phone: mForm.phone || null, note: mForm.note || null,
      }).eq("id", modal.id);
      if (wantP1 && p1Name.trim()) {
        await supabase.from("plus_one_requests").insert({ requested_by_name: modal.name, plus_one_name: p1Name.trim() });
      }
      await loadAll();
      setMStep("done");
    } catch (e) { console.error(e); }
    setMLoading(false);
  }

  function goAdmin() { setView("admin"); window.location.hash = "admin"; }
  function goSite() { setView("site"); window.location.hash = ""; }

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="load-screen">
        <div className="load-logo">B & R</div>
        <div className="load-spin" />
      </div>
    </>
  );

  if (view === "admin" && !authed) return (
    <>
      <style>{CSS}</style>
      <div className="pw-gate">
        <p className="pw-ey">Wedding Admin</p>
        <h1 className="pw-t">B & R</h1>
        <p className="pw-s">Enter the admin password to continue.</p>
        <form className="pw-row" onSubmit={handleAdminLogin}>
          <input className="pw-i" type="password" placeholder="Password" autoFocus
            value={pwIn} onChange={e => { setPwIn(e.target.value); setPwErr(false); }} />
          <button type="submit" className="pw-btn">Unlock →</button>
        </form>
        {pwErr && <p className="pw-err">Wrong password.</p>}
        <button className="pw-back" onClick={goSite}>← Back to site</button>
      </div>
    </>
  );

  if (view === "admin" && authed) return (
    <>
      <style>{CSS}</style>
      <div>
        <div className="adm-bar">
          <span className="adm-bar-t">Admin Panel</span>
          <div className="adm-acts">
            <button className="adm-back" onClick={goSite}>← View Site</button>
            <button className="adm-out" onClick={() => { setAuthed(false); setPwIn(""); }}>Log out</button>
          </div>
        </div>
        <div className="adm-body">
          <div className="adm-inner">

            <div className="adm-card">
              <h2>Site Details</h2>
              <div className="adm-g2">
                {[
                  ["Date (shown on site)", "event_date_display", "e.g. June 19, 2027"],
                  ["Date (ISO for countdown)", "event_date_iso", "e.g. 2027-06-19T17:00:00-07:00"],
                  ["Venue Name", "venue_name", "e.g. Rutland Centennial Hall"],
                  ["Venue Address", "venue_address", "e.g. 765 Doyle Ave, Kelowna"],
                  ["Doors Time", "doors_time", "e.g. 5:00 PM"],
                  ["Photo Album Link", "photo_album_link", "https://photos.google.com/..."],
                  ["Guest RSVP Password", "guest_password", "What guests enter to RSVP"],
                ].map(([label, key, ph]) => (
                  <div key={key} className="fg">
                    <label className="fl">{label}</label>
                    <input className="fi" placeholder={ph} value={editCfg[key] || ""}
                      onChange={e => setEditCfg({ ...editCfg, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button className="adm-save" onClick={saveConfig}>Save Changes</button>
              {cfgSaved && <p className="saved">✓ Saved and live!</p>}
            </div>

            <div className="adm-card">
              <h2>Guest List — {guests.length} invited</h2>
              <div className="add-row">
                <input className="fi" placeholder="Full name..." value={newGuest.name}
                  onChange={e => setNewGuest({ ...newGuest, name: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addGuest(); } }} />
                <input className="fi" placeholder="Email (optional — they'll add it when they RSVP)" value={newGuest.email}
                  onChange={e => setNewGuest({ ...newGuest, email: e.target.value })} />
                <input className="fi" placeholder="Phone (optional)" value={newGuest.phone}
                  onChange={e => setNewGuest({ ...newGuest, phone: e.target.value })} />
                <button className="add-btn" onClick={addGuest}>+ Add</button>
              </div>
              {guests.length === 0 && <p className="adm-empty">No guests yet. Add them above — they'll appear on the public list as ⏳ Pending until they RSVP.</p>}
              {guests.map(g => (
                <div key={g.id} className="gt-row">
                  <span className="gt-n">{g.name}</span>
                  <span className={`gt-b ${g.rsvp_status === "coming" ? "st-y" : g.rsvp_status === "not_coming" ? "st-n" : "st-p"}`}>
                    {g.rsvp_status === "coming" ? "✓ Coming" : g.rsvp_status === "not_coming" ? "✗ Can't make it" : "⏳ Pending"}
                  </span>
                  {g.email && <span style={{ fontSize: 12, color: "#9A98A4" }}>{g.email}</span>}
                  <button className="rm-btn" onClick={() => removeGuest(g.id)}>×</button>
                </div>
              ))}
            </div>

            {plusReqs.length > 0 && (
              <div className="adm-card">
                <h2>+1 Requests — {plusReqs.filter(r => r.status === "pending").length} pending</h2>
                {plusReqs.map(req => (
                  <div key={req.id} className="p1-row">
                    <div className="p1-row-top">
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{req.requested_by_name}</span>
                        <span style={{ color: "#6B6975", fontSize: 14 }}> wants to bring </span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{req.plus_one_name}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: "#9A98A4" }}>({req.status})</span>
                      </div>
                      {req.status === "pending" && (
                        <div className="p1-acts">
                          <button className="p1-approve" onClick={() => approvePlusOne(req)}>✓ Approve</button>
                          <button className="p1-deny" onClick={() => denyPlusOne(req.id)}>✗ Deny</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>

      {modal && (
        <div className="mo" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="mb">
            <button className="mc" onClick={() => setModal(null)}>×</button>

            {mStep === "pw" && (
              <form onSubmit={handleMPw}>
                <h2 className="mt">🔒 Hi, {modal.name.split(" ")[0]}!</h2>
                <p className="ms">Enter the guest password from your invitation to RSVP.</p>
                <div className="fg">
                  <label className="fl">Guest password</label>
                  <input className="fi" type="password" placeholder="••••••••••••" autoFocus
                    value={mPw} onChange={e => { setMPw(e.target.value); setMPwErr(false); }} />
                </div>
                {mPwErr && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>Wrong password — check your invite.</p>}
                <button type="submit" className="btn-primary">Continue →</button>
              </form>
            )}

            {mStep === "form" && (
              <form onSubmit={handleRsvpSubmit}>
                <h2 className="mt">Your RSVP</h2>
                <p className="ms">Fill in your details below. You can update this any time before the big day.</p>
                <div className="fg">
                  <label className="fl">Email</label>
                  <input className="fi" type="email" placeholder="email@example.com" value={mForm.email} required
                    onChange={e => setMForm({ ...mForm, email: e.target.value })} />
                </div>
                <div className="fg">
                  <label className="fl">Phone (optional)</label>
                  <input className="fi" type="tel" placeholder="250-555-0000"
                    value={mForm.phone} onChange={e => setMForm({ ...mForm, phone: e.target.value })} />
                </div>
                <div className="fg">
                  <label className="fl">Are you coming?</label>
                  <div className="att-row">
                    {[["coming", "🕺 Hell yes!", "att-y"], ["not_coming", "😢 Can't make it", "att-n"]].map(([v, label, cls]) => (
                      <button key={v} type="button"
                        className={`att-btn ${cls} ${mForm.attending === v ? "active" : ""}`}
                        onClick={() => setMForm({ ...mForm, attending: v })}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="fg">
                  <label className="fl">Note (optional)</label>
                  <textarea className="fta" placeholder="Song request, anything..." rows={3}
                    value={mForm.note} onChange={e => setMForm({ ...mForm, note: e.target.value })} />
                </div>

                {mForm.attending === "coming" && (
                  <div className="p1-section">
                    <button type="button"
                      className={`p1-toggle ${wantP1 ? "active" : ""}`}
                      onClick={() => setWantP1(!wantP1)}>
                      {wantP1 ? "↑ Never mind" : "＋ Request a +1"}
                    </button>
                    {wantP1 && (
                      <div className="fg">
                        <label className="fl">Who are you bringing?</label>
                        <input className="fi" placeholder="Their full name"
                          value={p1Name} onChange={e => setP1Name(e.target.value)} />
                        <p style={{ fontSize: 12, color: "#9A98A4", marginTop: 6 }}>Bentley & Robyn will approve your request — they'll appear on the guest list once confirmed.</p>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={mLoading} style={{ marginTop: 24 }}>
                  {mLoading ? "Sending..." : "Send it →"}
                </button>
              </form>
            )}

            {mStep === "done" && (
              <div className="mdone">
                <div className="mdone-i">🎉</div>
                <div className="mdone-t">
                  {mForm.attending === "coming" ? "You're on the list!" : "Got it."}
                </div>
                <div className="mdone-s">
                  {mForm.attending === "coming"
                    ? "Can't wait to dance with you. See you on the floor."
                    : "We'll miss you, but we love you. Thanks for letting us know."}
                </div>
                {wantP1 && p1Name && <p style={{ marginTop: 12, fontSize: 13, color: "#9A98A4" }}>Your +1 request for {p1Name} has been sent. We'll let them know when it's approved.</p>}
                <button className="btn-ghost" onClick={() => setModal(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="wnav">
        <span className="wnav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>B & R</span>
        <div className="wnav-links">
          <button className="wnl" onClick={() => go("vibe")}>The Vibe</button>
          <button className="wnl" onClick={() => go("details")}>Details</button>
          <button className="wnl" onClick={() => go("share-photos")}>Photos</button>
          {guests.length > 0 && <button className="wnl" onClick={() => go("guestlist")}>Guest List</button>}
        </div>
      </nav>

      <section className="hero">
        <div className="hero-eq">
          {EQ.map((b, i) => <div key={i} className="eq-b" style={{ animation: `${b.a} ${b.d} ${b.dl} ease-in-out infinite` }} />)}
        </div>
        <p className="hero-ey wu">best friends 4 eva 💛</p>
        <h1 className="hero-t wu wu1">BENTLEY<br /><span className="amp">&amp;</span><br />ROBYN</h1>
        <p className="hero-s wu wu2">{cfg.event_date_display} &nbsp;·&nbsp; {cfg.venue_name}</p>
        <div className="cd-row wu wu3">
          {[["days", tl.days], ["hours", tl.hours], ["mins", tl.minutes], ["secs", tl.seconds]].map(([l, v]) => (
            <div key={l} className="cd-box"><div className="cd-n">{pad(v)}</div><div className="cd-l">{l}</div></div>
          ))}
        </div>
        <button className="cta wu wu4" onClick={() => go("guestlist")}>Find my name →</button>
        <div className="sh">↓</div>
      </section>

      <section id="vibe" className="wsec">
        <div className="wi">
          <p className="ey">what to expect</p>
          <h2 className="st">We're keeping it exactly<br /><span className="acc">what it is.</span></h2>
          <div className="vibe-grid">
            {[
              { icon: "🕺", title: "Dancing", body: "Music from the moment doors open. Spotify, a request tablet, and a floor that IS the event." },
              { icon: "🍕", title: "Good Eats", body: "A proper spread of things you actually want to eat standing up. No sit-down dinner, no formalities." },
              { icon: "🍺", title: "Drinks", body: "Toonie bar. Beer, wine, seltzers. Simple, social, sorted." },
              { icon: "💛", title: "Each Other", body: "No lengthy speeches, no stuffy rituals. Just our favourite people in one room having an actual good time." },
            ].map(c => (
              <div key={c.title} className="vc">
                <span className="vi">{c.icon}</span>
                <div className="vt">{c.title}</div>
                <div className="vb">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="details" className="wsec wsec-alt">
        <div className="wi">
          <p className="ey">the details</p>
          <h2 className="st">Save the date.</h2>
          <div className="dg">
            {[
              { lbl: "📅 When", val: cfg.event_date_display, sub: "Saturday — confirmed once the hall is locked" },
              { lbl: "📍 Where", val: cfg.venue_name, sub: cfg.venue_address },
              { lbl: "⏰ Doors", val: cfg.doors_time, sub: "Come ready to dance" },
            ].map(d => (
              <div key={d.lbl} className="dc">
                <div className="dl">{d.lbl}</div>
                <div className="dv">{d.val}</div>
                <div className="ds">{d.sub}</div>
              </div>
            ))}
          </div>
          <div className="dn">
            <p style={{ fontSize: 14, color: "#6B6975", lineHeight: 1.75 }}>
              <span style={{ color: "#D97316", fontWeight: 700 }}>Dress code:</span>{" "}
              Whatever you want to dance in. Nice casual is the vibe — leave the heels at home if you actually plan to move.
            </p>
          </div>
        </div>
      </section>

      <section id="share-photos" className="wsec">
        <div className="wi">
          <p className="ey">from your eyes</p>
          <h2 className="st">Got a photo?<br /><span className="acc">Drop it here.</span></h2>
          <label className="drop">
            <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
              onChange={e => handlePhotoUpload(e.target.files)} disabled={uploading} />
            <div className="drop-icon">📸</div>
            <div className="drop-t">{uploading ? "Uploading..." : "Tap to choose photos or videos"}</div>
            <div className="drop-s">No account needed — straight from your camera roll</div>
          </label>
          {uploadMsg && <p className={`up-status ${uploadMsg.type}`}>{uploadMsg.text}</p>}
          {photos.length > 0 ? (
            <div className="pg-grid">
              {photos.map(p => (
                <div key={p.name} className="pg-item">
                  {p.name.match(/\.(mp4|mov|webm)$/i)
                    ? <video src={p.url} muted />
                    : <img src={p.url} alt="" loading="lazy" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="pg-empty">No photos yet — be the first!</p>
          )}
        </div>
      </section>

      {cfg.photo_album_link && (
        <section className="wsec">
          <div className="wi">
            <p className="ey">photos</p>
            <h2 className="st">Captured moments.</h2>
            <a href={cfg.photo_album_link} target="_blank" rel="noopener noreferrer" className="photo-btn">📸 View the Album →</a>
          </div>
        </section>
      )}

      {guests.length > 0 && (
        <section id="guestlist" className="wsec wsec-alt">
          <div className="wi">
            <p className="ey">who's coming</p>
            <h2 className="st">The guest list.</h2>
            <div className="gl-grid">
              {guests.map(g => (
                <div key={g.id} className="gl-card">
                  <span className="gl-name">{g.name}</span>
                  <span className={`gl-badge ${g.rsvp_status === "coming" ? "gb-y" : g.rsvp_status === "not_coming" ? "gb-n" : "gb-p"}`}>
                    {g.rsvp_status === "coming" ? "💃 Coming" : g.rsvp_status === "not_coming" ? "🥺 Can't make it" : "⏳ Pending"}
                  </span>
                  {g.rsvp_status === "pending"
                    ? <button className="rsvp-btn" onClick={() => openModal(g)}>RSVP →</button>
                    : <button className="rsvp-btn-done" onClick={() => openModal(g)}>Update</button>
                  }
                </div>
              ))}
            </div>
            <p style={{ marginTop: 24, fontSize: 13, color: "#9A98A4", textAlign: "center" }}>
              Don't see your name? Ask Bentley or Robyn to add you to the list.
            </p>
          </div>
        </section>
      )}

      <footer className="wfooter">
        <div className="wf-logo">Bentley &amp; Robyn</div>
        <div className="wf-sub">June 2027 · Kelowna, BC · best friends 4 eva</div>
        <button className="adm-link" onClick={goAdmin}>Admin</button>
      </footer>
    </>
  );
}
