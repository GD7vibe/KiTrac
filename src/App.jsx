import { useState, useEffect, useRef, useCallback } from "react";

const db = {
  scanEvents: [], reports: [],
  log(type, payload) {
    const entry = { type, payload, ts: new Date().toISOString() };
    if (type === "scan") this.scanEvents.push(entry); else this.reports.push(entry);
    console.log("[KiTrac]", entry); return entry;
  },
};

const C = {
  navy: "#0B1F3A", teal: "#00C4A0", tealDim: "#009E82",
  amber: "#FFB347", muted: "#7A8A9A", white: "#FFFFFF", danger: "#FF5A5A",
  inputBg: "#FFFFFF", inputText: "#0B1F3A", inputBorder: "#D0DCE8",
  inputDone: "#E6FAF5", inputDoneBorder: "#00C4A0",
};

// ── Keyframes — pulse uses outline, NOT box-shadow, so transition:all can't fight it ──
const KEYFRAMES = `
  @keyframes fieldPulse {
    0%   { outline: 3px solid rgba(0,196,160,0.9); outline-offset: 0px; }
    50%  { outline: 3px solid rgba(0,196,160,0);   outline-offset: 5px; }
    100% { outline: 3px solid rgba(0,196,160,0.9); outline-offset: 0px; }
  }
  @keyframes optPulse {
    0%   { box-shadow: 0 0 0 0px rgba(0,196,160,0.7); }
    50%  { box-shadow: 0 0 0 7px rgba(0,196,160,0);   }
    100% { box-shadow: 0 0 0 0px rgba(0,196,160,0.7); }
  }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes ping    { 0%{transform:scale(1);opacity:1} 80%,100%{transform:scale(2.4);opacity:0} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes btnPulse{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
  @keyframes tickPop { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
`;

const Icon = {
  Location: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>),
  Mic: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/></svg>),
  MicOff: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 10v-1m14 0v1a7 7 0 0 1-.11 1.23M12 19v3M8 22h8"/></svg>),
  Send: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  Check: () => (<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  Tick: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  Tag: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>),
  Alert: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>),
  MapPin: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>),
};

const TEXT_FIELDS = [
  { key: "school", label: "1. School or Club",    placeholder: "e.g. St Mary's Primary, Rovers FC U9s",      hint: "Where does this child go to school or which club is this kit from?", type: "input"    },
  { key: "town",   label: "2. Town or Postcode",  placeholder: "e.g. Guildford, GU1 3AA",                    hint: "Helps the parent locate where the item was found.",                 type: "input"    },
  { key: "item",   label: "3. Describe the Item", placeholder: "e.g. Navy school jumper, age 7–8, badge…",   hint: "Colour, size, any markings — anything that helps identify it.",     type: "textarea" },
];

const WHERE_OPTIONS = [
  { key: "lostproperty", label: "Left at lost property",      sub: "Handed in at school / club office",  icon: "🏫" },
  { key: "withme",       label: "I have it — contact me",     sub: "Item is safe with the person scanning", icon: "🙋" },
  { key: "other",        label: "Other location",             sub: "Tap to describe where it is",           icon: "📍" },
];

// All steps in order — text fields + the where step
const ALL_STEPS = [...TEXT_FIELDS.map(f => f.key), "where"];

export default function KiTrac() {
  const itemId = "KT-" + Math.random().toString(36).substr(2, 6).toUpperCase();

  const [phase, setPhase]             = useState("landing");
  const [location, setLocation]       = useState(null);
  const [locStatus, setLocStatus]     = useState("idle");
  const [isListening, setIsListening] = useState(false);
  const [voiceField, setVoiceField]   = useState(null);
  const [transcript, setTranscript]   = useState("");
  const [form, setForm]               = useState({ school: "", town: "", item: "" });
  const [whereChoice, setWhereChoice] = useState(null);   // key of selected option
  const [otherWhere, setOtherWhere]   = useState("");
  const [finderName, setFinderName]   = useState("");
  const [finderContact, setFinderContact] = useState("");
  const [errors, setErrors]           = useState({});
  const [abandoned, setAbandoned]     = useState(false);

  const recognitionRef = useRef(null);
  const abandonTimer   = useRef(null);
  const scanLogged     = useRef(false);

  // Which step is currently active (first incomplete)
  const activeStep = (() => {
    for (const f of TEXT_FIELDS) { if (!form[f.key].trim()) return f.key; }
    if (!whereChoice) return "where";
    if (whereChoice === "other" && !otherWhere.trim()) return "where";
    if (whereChoice === "withme" && !finderContact.trim()) return "where";
    return null; // all done
  })();

  const allDone = activeStep === null;

  // ── Geolocation on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (scanLogged.current) return;
    scanLogged.current = true;
    if (navigator.geolocation) {
      setLocStatus("fetching");
      navigator.geolocation.getCurrentPosition(
        pos => { const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setLocation(loc); setLocStatus("got"); db.log("scan", { itemId, loc }); },
        ()  => { setLocStatus("denied"); db.log("scan", { itemId, loc: null }); },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else { db.log("scan", { itemId, loc: null }); }
  }, []);

  // ── Abandon detection ────────────────────────────────────────────────────
  const resetAbandonTimer = useCallback(() => {
    clearTimeout(abandonTimer.current);
    if (phase === "form") {
      abandonTimer.current = setTimeout(() => {
        setAbandoned(true);
        db.log("abandon", { itemId, location, formPartial: form });
      }, 45000);
    }
  }, [phase, location, form]);

  useEffect(() => {
    window.addEventListener("click", resetAbandonTimer);
    window.addEventListener("keydown", resetAbandonTimer);
    window.addEventListener("touchstart", resetAbandonTimer);
    return () => { window.removeEventListener("click", resetAbandonTimer); window.removeEventListener("keydown", resetAbandonTimer); window.removeEventListener("touchstart", resetAbandonTimer); clearTimeout(abandonTimer.current); };
  }, [resetAbandonTimer]);

  useEffect(() => { if (phase === "form") resetAbandonTimer(); }, [phase]);

  // ── Voice ────────────────────────────────────────────────────────────────
  const startVoice = (field) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); setVoiceField(null); return; }
    const rec = new SR();
    rec.lang = "en-GB"; rec.interimResults = true; rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    rec.onstart  = () => { setIsListening(true); setVoiceField(field); setTranscript(""); };
    rec.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        if (field === "otherWhere") setOtherWhere(v => v ? v + " " + t : t);
        else if (field === "finderName") setFinderName(v => v ? v + " " + t : t);
        else if (field === "finderContact") setFinderContact(v => v ? v + " " + t : t);
        else setForm(f => ({ ...f, [field]: f[field] ? f[field] + " " + t : t }));
        setTranscript(""); setIsListening(false); setVoiceField(null);
      }
    };
    rec.onerror = () => { setIsListening(false); setVoiceField(null); };
    rec.onend   = () => { setIsListening(false); setVoiceField(null); };
    rec.start();
  };

  // ── Validate & submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = {};
    if (!form.school.trim())  e.school = "Please enter the school or club name";
    if (!form.town.trim())    e.town   = "Please enter a town or postcode";
    if (!form.item.trim())    e.item   = "Please describe the item";
    if (!whereChoice)         e.where  = "Please select where the item is";
    if (whereChoice === "other" && !otherWhere.trim()) e.where = "Please describe where the item is";
    if (whereChoice === "withme" && !finderContact.trim()) e.where = "Please enter a phone number or email so the parent can reach you";
    if (Object.keys(e).length) { setErrors(e); return; }
    setPhase("submitting");

    // Build the where description
    const whereTxt = whereChoice === "lostproperty" ? "Left at lost property"
      : whereChoice === "withme" ? `I have it — contact me${finderName ? ` (${finderName})` : ""}${finderContact ? `: ${finderContact}` : ""}`
      : whereChoice === "other" ? (otherWhere || "Other location") : "Unknown";

    const locTxt = location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Not captured";
    const time = new Date().toLocaleString("en-GB");

    // Build HTML email
    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0B1F3A;border-radius:16px;padding:28px 24px;color:#FFFFFF;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <div style="width:40px;height:40px;border-radius:10px;background:#00C4A0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:#0B1F3A;">KT</div>
          <div>
            <div style="font-size:22px;font-weight:700;">KiTrac Alert</div>
            <div style="font-size:12px;color:#00C4A0;">Someone found your child's item!</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:18px;margin-bottom:16px;">
          <table style="width:100%;border-collapse:collapse;color:#C8D4E0;font-size:14px;">
            <tr><td style="padding:6px 0;color:#7A8A9A;">Item ID</td><td style="padding:6px 0;font-weight:600;color:#FFFFFF;">${itemId}</td></tr>
            <tr><td style="padding:6px 0;color:#7A8A9A;">School / Club</td><td style="padding:6px 0;font-weight:600;color:#FFFFFF;">${form.school}</td></tr>
            <tr><td style="padding:6px 0;color:#7A8A9A;">Town / Postcode</td><td style="padding:6px 0;font-weight:600;color:#FFFFFF;">${form.town}</td></tr>
            <tr><td style="padding:6px 0;color:#7A8A9A;">Item Description</td><td style="padding:6px 0;font-weight:600;color:#FFFFFF;">${form.item}</td></tr>
            <tr><td style="padding:6px 0;color:#7A8A9A;">Where is it?</td><td style="padding:6px 0;font-weight:600;color:#00C4A0;">${whereTxt}</td></tr>
            <tr><td style="padding:6px 0;color:#7A8A9A;">GPS Location</td><td style="padding:6px 0;font-weight:600;color:#FFFFFF;">${locTxt}</td></tr>
            <tr><td style="padding:6px 0;color:#7A8A9A;">Scanned at</td><td style="padding:6px 0;font-weight:600;color:#FFFFFF;">${time}</td></tr>
          </table>
        </div>
        ${finderName || finderContact ? `
        <div style="background:rgba(0,196,160,0.1);border:1px solid rgba(0,196,160,0.25);border-radius:12px;padding:14px;margin-bottom:16px;">
          <div style="font-size:12px;color:#00C4A0;font-weight:600;margin-bottom:6px;">Finder Contact Details</div>
          ${finderName ? `<div style="font-size:14px;color:#FFFFFF;">Name: <strong>${finderName}</strong></div>` : ""}
          ${finderContact ? `<div style="font-size:14px;color:#FFFFFF;">Contact: <strong>${finderContact}</strong></div>` : ""}
        </div>` : ""}
        <div style="font-size:11px;color:#4A6A8A;text-align:center;margin-top:16px;">
          KiTrac · Child Kit Safety · This is an automated alert from the KiTrac prototype.
        </div>
      </div>`;

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `KiTrac Alert: ${form.item} found at ${form.school}`,
          html: html,
        }),
      });
      const data = await res.json();
      console.log("[KiTrac] Email sent:", data);
    } catch (err) {
      console.error("[KiTrac] Email failed:", err);
    }

    db.log("report", { itemId, form, whereChoice, otherWhere, finderName, finderContact, location });
    setPhase("done");
  };

  const hasVoice = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const whereLabel = whereChoice === "lostproperty" ? "Left at lost property"
    : whereChoice === "withme" ? `I have it — contact me${finderName ? ` (${finderName})` : ""}${finderContact ? `: ${finderContact}` : ""}`
    : whereChoice === "other"  ? (otherWhere || "Other location")
    : null;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.navy}; }
        input, textarea { font-family: 'Lexend', sans-serif; font-size: 16px; }
        textarea { resize: none; }
        .field-row { display: flex; gap: 8px; align-items: flex-start; }
        .field-row textarea, .field-row input { flex: 1; }
        .mic-btn {
          flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px;
          border: 1.5px solid transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.18s;
        }
        .mic-btn:hover { transform: scale(1.06); }
        .opt-btn {
          width: 100%; background: ${C.white}; border-radius: 12px;
          padding: 13px 15px; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 12px; text-align: left;
          font-family: 'Lexend', sans-serif;
        }
        .opt-btn:hover { transform: translateY(-1px); }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{ minHeight: "100vh", background: C.navy, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 48px", fontFamily: "'Lexend', sans-serif", color: C.white }}>

        {/* ── Header ── */}
        <header style={{ width: "100%", maxWidth: 480, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="46" height="46" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Tag — flat top & left edges, point to bottom-right */}
                <path d="M10 10 L40 10 L54 24 L54 54 L24 54 L10 40 Z" fill="#0B1F3A"/>
                {/* Tag hole top-left */}
                <circle cx="19" cy="19" r="4.5" fill="#00C4A0"/>
                {/* Bold tick */}
                <polyline points="22,34 30,43 46,25" fill="none" stroke="#00C4A0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1 }}>Ki<span style={{ color: C.teal }}>Trac</span></span>
              <span style={{ fontSize: 13, fontWeight: 400, color: C.teal, letterSpacing: "0.3px" }}>Track your kit!</span>
            </div>
          </div>
          {locStatus === "got" && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.teal, background: "rgba(0,196,160,0.12)", borderRadius: 20, padding: "4px 10px" }}>
              <Icon.Location /><span>Location logged</span>
            </div>
          )}
        </header>

        {/* ── Item chip ── */}
        <div style={{ width: "100%", maxWidth: 480, margin: "10px 0 0", background: "rgba(255,179,71,0.12)", border: "1px solid rgba(255,179,71,0.28)", borderRadius: 10, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, animation: "fadeUp 0.4s ease both" }}>
          <Icon.Alert />
          <span style={{ fontSize: 12, color: C.amber }}>Item ID: <strong>{itemId}</strong> · Scanned at {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        {/* ══════════ LANDING ══════════ */}
        {phase === "landing" && (
          <div style={{ width: "100%", maxWidth: 480, marginTop: 24, animation: "fadeUp 0.5s ease 0.1s both" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "26px 22px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, color: C.navy }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, marginBottom: 12 }}>
                You've found something<br/><span style={{ color: C.teal }}>that belongs to a child.</span>
              </h1>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#C0D0E0", marginBottom: 20 }}>
                This item is registered on <strong style={{ color: C.white }}>KiTrac</strong>. The parent has been <strong style={{ color: C.teal }}>automatically notified</strong> that it was just scanned.
              </p>
              <div style={{ background: "rgba(0,196,160,0.08)", border: "1px solid rgba(0,196,160,0.2)", borderRadius: 12, padding: "13px 15px", marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: C.teal, fontWeight: 600, marginBottom: 5 }}>🔒 Your privacy is protected</p>
                <p style={{ fontSize: 13, color: "#A8BDD0", lineHeight: 1.6 }}>You will <strong style={{ color: C.white }}>never see the child's personal details</strong>. The parent contacts you — not the other way around.</p>
              </div>
              <p style={{ fontSize: 13, color: "#8A9AAA", marginBottom: 20, lineHeight: 1.6 }}>Takes <strong style={{ color: C.white }}>under 60 seconds</strong>. Four quick steps — school, location, what the item is, and where you've left it.</p>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                {["✓ No account needed", "✓ No app to download", "✓ 100% anonymous"].map(txt => (
                  <span key={txt} style={{ fontSize: 14, fontWeight: 600, color: C.amber, background: "rgba(255,179,71,0.12)", border: "1px solid rgba(255,179,71,0.3)", borderRadius: 20, padding: "5px 13px", whiteSpace: "nowrap" }}>{txt}</span>
                ))}
              </div>

              <button onClick={() => setPhase("form")} style={{ width: "100%", padding: "15px", background: C.teal, border: "none", borderRadius: 12, color: C.navy, fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Lexend', sans-serif", animation: "btnPulse 2s infinite", letterSpacing: "0.2px" }}>
                Report Found Item →
              </button>
            </div>
          </div>
        )}

        {/* ══════════ FORM ══════════ */}
        {(phase === "form" || phase === "submitting") && (
          <div style={{ width: "100%", maxWidth: 480, marginTop: 22, animation: "fadeUp 0.4s ease both" }}>

            {abandoned && (
              <div style={{ background: "rgba(255,90,90,0.1)", border: "1px solid rgba(255,90,90,0.28)", borderRadius: 10, padding: "11px 14px", marginBottom: 14, display: "flex", gap: 8 }}>
                <span style={{ color: C.danger }}><Icon.Alert /></span>
                <p style={{ fontSize: 13, color: "#FF9090", lineHeight: 1.55 }}>Still there? The parent knows this was scanned — a quick note would mean a lot.</p>
              </div>
            )}

            <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Tell us about the item</h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              Each box glows when it's your turn to fill it in. {hasVoice ? "Tap the mic to speak." : ""}
            </p>

            {/* ── Progress bar ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
              {ALL_STEPS.map((stepKey, i) => {
                const isDone = stepKey === "where"
                  ? (whereChoice && (whereChoice !== "other" || otherWhere.trim()))
                  : form[stepKey]?.trim().length > 0;
                const isAct = activeStep === stepKey;
                const label = stepKey === "school" ? "School" : stepKey === "town" ? "Town" : stepKey === "item" ? "Item" : "Where";
                return (
                  <div key={stepKey} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: isDone ? C.teal : isAct ? "rgba(0,196,160,0.15)" : "rgba(255,255,255,0.07)", border: `2px solid ${isDone ? C.teal : isAct ? C.teal : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isDone ? C.navy : isAct ? C.teal : C.muted, fontSize: 11, fontWeight: 700, transition: "all 0.35s", animation: isAct ? "optPulse 1.8s ease-in-out infinite" : "none" }}>
                        {isDone ? <Icon.Tick /> : i + 1}
                      </div>
                      <span style={{ fontSize: 10, color: isDone ? C.teal : isAct ? "#D0E8F8" : C.muted, fontWeight: isDone || isAct ? 600 : 400, transition: "all 0.3s" }}>{label}</span>
                    </div>
                    {i < ALL_STEPS.length - 1 && (
                      <div style={{ height: 2, flex: 1, marginBottom: 14, background: isDone ? C.teal : "rgba(255,255,255,0.1)", borderRadius: 2, transition: "background 0.4s" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Text fields 1–3 ── */}
            {TEXT_FIELDS.map((f) => {
              const val    = form[f.key];
              const isDone = val.trim().length > 0;
              const isAct  = activeStep === f.key;
              const hasErr = errors[f.key];

              const borderCol = hasErr ? C.danger : isDone ? C.inputDoneBorder : isAct ? C.teal : C.inputBorder;
              const bgCol     = isDone ? C.inputDone : C.inputBg;

              const sharedStyle = {
                display: "block", width: "100%", padding: "14px 15px",
                background: bgCol,
                border: `2px solid ${borderCol}`,
                borderRadius: 12, color: C.inputText, fontSize: 15,
                fontFamily: "'Lexend', sans-serif",
                outline: "none",
                transition: "border-color 0.25s, background 0.25s",
                // KEY FIX: animation drives outline, not box-shadow, so transition can't interfere
                animation: isAct && !isDone && !hasErr ? "fieldPulse 1.6s ease-in-out infinite" : "none",
              };

              return (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: isDone ? C.teal : isAct ? "#E0ECF8" : "#A0B4C8", transition: "color 0.3s" }}>{f.label}</label>
                    {isDone && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.teal, fontWeight: 600, animation: "tickPop 0.3s ease both" }}><Icon.Tick /> Done</span>}
                    {hasErr && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.danger }}><Icon.Alert /> {errors[f.key]}</span>}
                  </div>
                  <div className="field-row">
                    {f.type === "textarea"
                      ? <textarea rows={3} value={val} placeholder={f.placeholder} onChange={e => { setForm(v => ({ ...v, [f.key]: e.target.value })); setErrors(er => ({ ...er, [f.key]: null })); }} style={sharedStyle}/>
                      : <input type="text" value={val} placeholder={f.placeholder} onChange={e => { setForm(v => ({ ...v, [f.key]: e.target.value })); setErrors(er => ({ ...er, [f.key]: null })); }} style={sharedStyle}/>
                    }
                    {hasVoice && (
                      <button className="mic-btn" onClick={() => startVoice(f.key)} style={{ background: isListening && voiceField === f.key ? "rgba(255,90,90,0.12)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${isListening && voiceField === f.key ? C.danger : "rgba(255,255,255,0.15)"}`, color: isListening && voiceField === f.key ? C.danger : C.muted, animation: isListening && voiceField === f.key ? "blink 0.9s infinite" : "none", alignSelf: f.type === "textarea" ? "flex-start" : "center" }}>
                        {isListening && voiceField === f.key ? <Icon.MicOff /> : <Icon.Mic />}
                      </button>
                    )}
                  </div>
                  {isListening && voiceField === f.key && transcript && (
                    <div style={{ marginTop: 6, padding: "7px 11px", background: "rgba(0,196,160,0.08)", border: "1px solid rgba(0,196,160,0.2)", borderRadius: 8, fontSize: 13, color: C.teal, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, animation: "blink 0.8s infinite", flexShrink: 0 }} />
                      "{transcript}"
                    </div>
                  )}
                  {!hasErr && <p style={{ fontSize: 11, color: "#6A8A9A", marginTop: 5, lineHeight: 1.5 }}>{f.hint}</p>}
                </div>
              );
            })}

            {/* ── Step 4: Where is the item? ── */}
            {(() => {
              const isAct    = activeStep === "where";
              const isDone   = whereChoice && (whereChoice !== "other" || otherWhere.trim());
              const hasErr   = errors.where;
              const allTextDone = TEXT_FIELDS.every(f => form[f.key].trim().length > 0);

              return (
                <div style={{ marginBottom: 16, opacity: allTextDone ? 1 : 0.4, transition: "opacity 0.4s", pointerEvents: allTextDone ? "auto" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: isDone ? C.teal : isAct ? "#E0ECF8" : "#A0B4C8", transition: "color 0.3s" }}>4. Where is the item now?</label>
                    {isDone && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.teal, fontWeight: 600, animation: "tickPop 0.3s ease both" }}><Icon.Tick /> Done</span>}
                    {hasErr && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.danger }}><Icon.Alert /> {errors.where}</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {WHERE_OPTIONS.map(opt => {
                      const selected = whereChoice === opt.key;
                      return (
                        <button
                          key={opt.key}
                          className="opt-btn"
                          onClick={() => { setWhereChoice(opt.key); setErrors(er => ({ ...er, where: null })); }}
                          style={{
                            background: selected ? C.inputDone : C.white,
                            border: `2px solid ${selected ? C.teal : isAct && !whereChoice ? C.teal : C.inputBorder}`,
                            boxShadow: "none",
                            // Pulse the whole group of options when this step is active and nothing selected yet
                            animation: isAct && !whereChoice ? "optPulse 1.6s ease-in-out infinite" : "none",
                          }}
                        >
                          <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: selected ? C.tealDim : C.inputText }}>{opt.label}</div>
                            <div style={{ fontSize: 12, color: selected ? "#009E82" : "#6A8A9A", marginTop: 2 }}>{opt.sub}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? C.teal : C.inputBorder}`, background: selected ? C.teal : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {selected && <Icon.Tick />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* "I have it" — contact details slide in */}
                  {whereChoice === "withme" && (
                    <div style={{ marginTop: 10, animation: "fadeUp 0.3s ease both", background: "rgba(0,196,160,0.05)", border: "1px solid rgba(0,196,160,0.2)", borderRadius: 12, padding: "14px 14px 10px" }}>
                      <p style={{ fontSize: 12, color: C.teal, fontWeight: 600, marginBottom: 12 }}>👋 Leave your contact details so the parent can reach you</p>

                      {/* Name — optional */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#A0B4C8", display: "block", marginBottom: 5 }}>Your name <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></label>
                        <div className="field-row">
                          <input
                            type="text"
                            value={finderName}
                            placeholder="e.g. Sarah"
                            onChange={e => setFinderName(e.target.value)}
                            style={{ display: "block", width: "100%", padding: "12px 13px", background: finderName.trim() ? C.inputDone : C.white, border: `2px solid ${finderName.trim() ? C.inputDoneBorder : C.inputBorder}`, borderRadius: 10, color: C.inputText, fontSize: 15, fontFamily: "'Lexend', sans-serif", outline: "none", transition: "all 0.25s" }}
                          />
                          {hasVoice && (
                            <button className="mic-btn" onClick={() => startVoice("finderName")} style={{ background: isListening && voiceField === "finderName" ? "rgba(255,90,90,0.12)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${isListening && voiceField === "finderName" ? C.danger : "rgba(255,255,255,0.15)"}`, color: isListening && voiceField === "finderName" ? C.danger : C.muted }}>
                              {isListening && voiceField === "finderName" ? <Icon.MicOff /> : <Icon.Mic />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Contact — required */}
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#A0B4C8", display: "block", marginBottom: 5 }}>Phone or email <span style={{ fontWeight: 600, color: C.danger }}>*</span></label>
                        <div className="field-row">
                          <input
                            type="text"
                            inputMode="email"
                            value={finderContact}
                            placeholder="e.g. 07700 900123 or sarah@email.com"
                            onChange={e => { setFinderContact(e.target.value); setErrors(er => ({ ...er, where: null })); }}
                            style={{ display: "block", width: "100%", padding: "12px 13px", background: finderContact.trim() ? C.inputDone : C.white, border: `2px solid ${errors.where ? C.danger : finderContact.trim() ? C.inputDoneBorder : C.teal}`, borderRadius: 10, color: C.inputText, fontSize: 15, fontFamily: "'Lexend', sans-serif", outline: "none", transition: "all 0.25s", animation: !finderContact.trim() ? "fieldPulse 1.6s ease-in-out infinite" : "none" }}
                          />
                          {hasVoice && (
                            <button className="mic-btn" onClick={() => startVoice("finderContact")} style={{ background: isListening && voiceField === "finderContact" ? "rgba(255,90,90,0.12)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${isListening && voiceField === "finderContact" ? C.danger : "rgba(255,255,255,0.15)"}`, color: isListening && voiceField === "finderContact" ? C.danger : C.muted }}>
                              {isListening && voiceField === "finderContact" ? <Icon.MicOff /> : <Icon.Mic />}
                            </button>
                          )}
                        </div>
                        {isListening && voiceField === "finderContact" && transcript && (
                          <div style={{ marginTop: 6, padding: "7px 11px", background: "rgba(0,196,160,0.08)", border: "1px solid rgba(0,196,160,0.2)", borderRadius: 8, fontSize: 13, color: C.teal, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, animation: "blink 0.8s infinite", flexShrink: 0 }} />"{transcript}"
                          </div>
                        )}
                        <p style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>Only shared with the registered parent — never made public.</p>
                      </div>
                    </div>
                  )}

                  {/* "Other" free-text box slides in */}
                  {whereChoice === "other" && (
                    <div style={{ marginTop: 10, animation: "fadeUp 0.3s ease both" }}>
                      <div className="field-row">
                        <input
                          type="text"
                          value={otherWhere}
                          placeholder="Describe where you've left it…"
                          onChange={e => { setOtherWhere(e.target.value); setErrors(er => ({ ...er, where: null })); }}
                          style={{ display: "block", width: "100%", padding: "13px 14px", background: C.white, border: `2px solid ${otherWhere.trim() ? C.inputDoneBorder : C.teal}`, borderRadius: 12, color: C.inputText, fontSize: 15, fontFamily: "'Lexend', sans-serif", outline: "none", animation: !otherWhere.trim() ? "fieldPulse 1.6s ease-in-out infinite" : "none" }}
                        />
                        {hasVoice && (
                          <button className="mic-btn" onClick={() => startVoice("otherWhere")} style={{ background: isListening && voiceField === "otherWhere" ? "rgba(255,90,90,0.12)" : "rgba(255,255,255,0.08)", border: `1.5px solid ${isListening && voiceField === "otherWhere" ? C.danger : "rgba(255,255,255,0.15)"}`, color: isListening && voiceField === "otherWhere" ? C.danger : C.muted }}>
                            {isListening && voiceField === "otherWhere" ? <Icon.MicOff /> : <Icon.Mic />}
                          </button>
                        )}
                      </div>
                      {isListening && voiceField === "otherWhere" && transcript && (
                        <div style={{ marginTop: 6, padding: "7px 11px", background: "rgba(0,196,160,0.08)", border: "1px solid rgba(0,196,160,0.2)", borderRadius: 8, fontSize: 13, color: C.teal, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, animation: "blink 0.8s infinite", flexShrink: 0 }} />"{transcript}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Location strip ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", background: "rgba(255,255,255,0.04)", borderRadius: 9, marginBottom: 22 }}>
              <span style={{ color: locStatus === "got" ? C.teal : locStatus === "denied" ? C.muted : C.amber }}><Icon.Location /></span>
              <span style={{ fontSize: 12, color: locStatus === "got" ? C.teal : C.muted, lineHeight: 1.5 }}>
                {locStatus === "fetching" && "Getting your approximate location…"}
                {locStatus === "got"      && "GPS location captured — helps narrow down where it was found"}
                {locStatus === "denied"   && "Location not shared — that's fine, town/postcode above helps instead"}
                {locStatus === "idle"     && "Location will be noted if your browser allows it"}
              </span>
            </div>

            {/* ── Submit ── */}
            <button
              onClick={handleSubmit}
              disabled={phase === "submitting" || !allDone}
              style={{ width: "100%", padding: "16px", background: allDone ? C.teal : "rgba(0,196,160,0.28)", border: "none", borderRadius: 12, color: allDone ? C.navy : "rgba(255,255,255,0.35)", fontFamily: "'Lexend', sans-serif", fontSize: 16, fontWeight: 700, cursor: allDone && phase !== "submitting" ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.35s", boxShadow: allDone ? "0 6px 20px rgba(0,196,160,0.35)" : "none" }}
            >
              {phase === "submitting"
                ? <><div style={{ width: 18, height: 18, border: "2px solid rgba(11,31,58,0.3)", borderTopColor: C.navy, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Sending…</>
                : <><Icon.Send />Send Report to Parent</>
              }
            </button>
            <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 11, lineHeight: 1.6 }}>Your details are never shared publicly. The parent will contact you if needed.</p>
          </div>
        )}

        {/* ══════════ DONE ══════════ */}
        {phase === "done" && (
          <div style={{ width: "100%", maxWidth: 480, marginTop: 28, animation: "fadeUp 0.5s ease both" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 18, padding: "32px 22px", border: "1px solid rgba(0,196,160,0.2)", textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-flex", marginBottom: 22 }}>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}><Icon.Check /></div>
                <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${C.teal}`, animation: "ping 1.5s ease-out 0.3s both" }} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Thank you — <span style={{ color: C.teal }}>you're a legend!</span></h2>
              <p style={{ fontSize: 14, color: "#C0D0E0", lineHeight: 1.7, marginBottom: 22 }}>The parent has been <strong style={{ color: C.white }}>notified right now</strong>. You've just made someone's day a whole lot better.</p>
              <div style={{ background: "rgba(0,196,160,0.08)", borderRadius: 12, padding: "15px", marginBottom: 22, textAlign: "left" }}>
                <p style={{ fontSize: 12, color: C.teal, fontWeight: 600, marginBottom: 8 }}>What was sent to the parent:</p>
                <div style={{ fontSize: 13, color: "#A8BDD0", lineHeight: 1.9 }}>
                  <div>🏫 <strong style={{ color: C.white }}>School/Club:</strong> {form.school}</div>
                  <div>📍 <strong style={{ color: C.white }}>Location:</strong> {form.town}{locStatus === "got" ? ` (GPS: ${location?.lat?.toFixed(4)}, ${location?.lng?.toFixed(4)})` : ""}</div>
                  <div>👕 <strong style={{ color: C.white }}>Item:</strong> {form.item}</div>
                  <div>📦 <strong style={{ color: C.white }}>Where:</strong> {whereLabel}</div>
                  <div>🕐 <strong style={{ color: C.white }}>Time:</strong> {new Date().toLocaleString("en-GB")}</div>
                </div>
              </div>
              <div style={{ marginTop: 4, background: "rgba(255,179,71,0.08)", border: "1px solid rgba(255,179,71,0.25)", borderRadius: 14, padding: "20px 18px" }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: C.white, marginBottom: 6, lineHeight: 1.4 }}>
                  Want to protect your own<br/>children's kit?
                </p>
                <p style={{ fontSize: 13, color: "#A8BDD0", marginBottom: 16, lineHeight: 1.6 }}>
                  Register with KiTrac and get QR labels for every item. If it's ever found, you'll be notified instantly — just like this parent was.
                </p>
                <a
                  href="#"
                  style={{ display: "block", width: "100%", padding: "15px", background: C.amber, border: "none", borderRadius: 12, color: C.navy, fontSize: 17, fontWeight: 700, textDecoration: "none", textAlign: "center", fontFamily: "'Lexend', sans-serif", boxShadow: "0 6px 20px rgba(255,179,71,0.35)", animation: "btnPulse 2.5s infinite", letterSpacing: "0.2px" }}
                >
                  Register Free with KiTrac →
                </a>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>
                  Free to start · No card needed · Takes 2 minutes
                </p>
              </div>
            </div>
            <details style={{ marginTop: 18, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "11px 13px" }}>
              <summary style={{ cursor: "pointer", fontSize: 11, color: C.muted }}>🛠 Dev — logged events</summary>
              <pre style={{ whiteSpace: "pre-wrap", color: "#6A8A9A", fontSize: 10, marginTop: 8 }}>{JSON.stringify({ scanEvents: db.scanEvents, reports: db.reports }, null, 2)}</pre>
            </details>
          </div>
        )}

        <footer style={{ marginTop: 36, textAlign: "center", fontSize: 11, color: "#3A5A7A", lineHeight: 1.9 }}>
          <p><strong style={{ color: "#4A6A8A" }}>KiTrac</strong> · Child Kit Safety · kitrac.co.uk</p>
          <p>Powered by responsible parents, good strangers, and smart labels.</p>
        </footer>
      </div>
    </>
  );
}
