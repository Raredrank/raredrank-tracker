import { useState, useEffect, useCallback } from "react";

// ============================================================
// CONFIGURATION SUPABASE
// ============================================================
const SUPABASE_URL = "https://cztiubjkhjyolqtettjs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dGl1YmpraGp5b2xxdGV0dGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4Mjg2OTMsImV4cCI6MjA5ODQwNDY5M30.-AjL3RU3HzAKACzyBF-MftEGA7mavFjqa1KdhmrhquE";

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const SEED_PDVS = [
  {nom:"IGA Varennes",ville:"Varennes",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Longueuil (boul. Jean-Paul-Vincent)",ville:"Longueuil",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Longueuil (ch. Chambly)",ville:"Longueuil",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:"Logan"},
  {nom:"IGA Greenfield Park",ville:"Greenfield Park",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Sainte-Julie",ville:"Sainte-Julie",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Saint-Amable",ville:"Saint-Amable",type:"IGA",freq:14,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Contrecoeur",ville:"Contrecoeur",type:"IGA",freq:14,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Saint-Basile-le-Grand",ville:"Saint-Basile-le-Grand",type:"IGA",freq:14,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Saint-Bruno",ville:"Saint-Bruno",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA La Prairie",ville:"La Prairie",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:"Louis-Gabriel"},
  {nom:"Maxi Brossard",ville:"Brossard",type:"Maxi",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Montréal (Complexe Desjardins)",ville:"Montréal",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Montréal (Place Dupuis)",ville:"Montréal",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Montréal (Verdun — rue Beaudry)",ville:"Montréal",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Montréal (Verdun — Monk)",ville:"Montréal",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Saint-Jean-sur-Richelieu",ville:"Saint-Jean-sur-Richelieu",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Chambly",ville:"Chambly",type:"IGA",freq:14,stock:50,visite:"2026-06-15",employe:"Logan"},
  {nom:"IGA Laval (Sévingy)",ville:"Laval",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:"David"},
  {nom:"IGA Laval (Extra des Rapides)",ville:"Laval",type:"IGA",freq:7,stock:50,visite:"2026-06-15",employe:"David"},
  {nom:"Metro Thibault (Saint-Jérôme)",ville:"Saint-Jérôme",type:"Metro",freq:14,stock:50,visite:"2026-06-15",employe:""},
  {nom:"Metro Longueuil (Domingue St-Charles)",ville:"Longueuil",type:"Metro",freq:7,stock:50,visite:"2026-06-15",employe:""},
  {nom:"IGA Saint-Rémi",ville:"Saint-Rémi",type:"IGA",freq:14,stock:50,visite:"2026-06-15",employe:""},
];
const SEED_EMPLOYEES = ["Logan", "David", "Louis-Gabriel"];

function joursDepuis(d) { return Math.floor((TODAY - new Date(d)) / 86400000); }
function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}
function joursAvant(p)  { return Math.max(0, p.freq - joursDepuis(p.visite)); }
function prochaineVisite(p) {
  const r = new Date(p.visite);
  r.setDate(r.getDate() + p.freq);
  return r.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}
function calcStock(p) {
  const j = joursDepuis(p.visite);
  const pct = 100 - (j / p.freq) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
function getStatus(p) {
  if (p.force_urgent) return "urgent";
  const stock = calcStock(p);
  if (stock <= 20) return "urgent";
  if (stock <= 40) return "soon";
  return "ok";
}
function barColor(s) {
  if (s <= 20) return "#E24B4A";
  if (s <= 40) return "#EF9F27";
  return "#4A9A2F";
}

const PALETTE = [
  { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
  { bg: "#FDF4FF", color: "#7E22CE", border: "#E9D5FF" },
  { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  { bg: "#F0FDFA", color: "#0F766E", border: "#99F6E4" },
  { bg: "#FEF9C3", color: "#854D0E", border: "#FEF08A" },
];
function employeeColor(name, employees) {
  const idx = employees.indexOf(name);
  return PALETTE[idx % PALETTE.length] || PALETTE[0];
}

const BANNER_STYLES = {
  IGA:   { bg: "#FEF2F2", color: "#991B1B", border: "#FECACA" },
  Maxi:  { bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA" },
  Metro: { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0" },
  Autre: { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0" },
};

function BannerBadge({ type }) {
  const s = BANNER_STYLES[type] || BANNER_STYLES.Autre;
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
      {type}
    </span>
  );
}

const FREQ_STYLES = {
  7:  { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "/ semaine" },
  14: { bg: "#F5F3FF", color: "#5B21B6", border: "#DDD6FE", label: "/ 2 semaines" },
  30: { bg: "#FFF7ED", color: "#9A3412", border: "#FED7AA", label: "/ mois" },
};
function FreqBadge({ freq }) {
  const s = FREQ_STYLES[freq] || FREQ_STYLES[7];
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 500, whiteSpace: "nowrap",
      background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function EmployeBadge({ name, employees }) {
  if (!name) return <span style={{ fontSize: 12, color: "#CBD5E1", fontStyle: "italic" }}>—</span>;
  const c = employeeColor(name, employees);
  return (
    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 999, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {name}
    </span>
  );
}

function StockBar({ stock }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#F1F5F9", overflow: "hidden" }}>
        <div style={{ width: `${stock}%`, height: "100%", borderRadius: 3, background: barColor(stock), transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 12, minWidth: 32, textAlign: "right", color: "#64748B", fontVariantNumeric: "tabular-nums" }}>
        {stock}%
      </span>
    </div>
  );
}

function StatusChip({ p }) {
  const j = joursDepuis(p.visite);
  const status = getStatus(p);
  if (status === "urgent") {
    const label = j >= p.freq ? `+${j - p.freq}j retard` : "Stock critique";
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600,
      background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>{label}</span>;
  }
  if (status === "soon") return <span style={{ fontSize: 12, color: "#92400E" }}>dans {joursAvant(p)}j</span>;
  return <span style={{ fontSize: 12, color: "#64748B" }}>{prochaineVisite(p)}</span>;
}

function IconBtn({ onClick, title, color, bg, children, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${hover ? color || "#CBD5E1" : "#E2E8F0"}`,
        background: hover ? (bg || "#F8FAFC") : "transparent", color: hover ? (color || "#334155") : "#94A3B8",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, transition: "all 0.15s", flexShrink: 0 }}>
      {children}
    </button>
  );
}

function SectionTitle({ icon, label, count, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 8px",
      paddingBottom: 6, borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 999, background: color + "22",
        color: color, fontWeight: 700, marginLeft: 2 }}>{count}</span>
    </div>
  );
}

const TH = ({ children }) => (
  <th style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textAlign: "left",
    padding: "6px 10px", whiteSpace: "nowrap", borderBottom: "1px solid #F1F5F9" }}>
    {children}
  </th>
);

function PDVRow({ p, employees, onSuivi, onEdit, onDelete, onForce, busy }) {
  const [hover, setHover] = useState(false);
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? "#FAFBFC" : "transparent", transition: "background 0.12s" }}>
      <td style={{ padding: "9px 10px", fontWeight: 500, fontSize: 13, color: "#0F172A", maxWidth: 200 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nom}</span>
          {p.backstock && <span title="Stock disponible en back-store" style={{ fontSize: 12, flexShrink: 0 }}>📦</span>}
          {p.force_urgent && <span title="Forcé manuellement dans À visiter maintenant" style={{ fontSize: 12, flexShrink: 0 }}>📌</span>}
        </span>
      </td>
      <td style={{ padding: "9px 10px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
        {p.ville}
        {p.dernier_visiteur && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>👤 {p.dernier_visiteur}</div>}
      </td>
      <td style={{ padding: "9px 10px" }}><BannerBadge type={p.type} /></td>
      <td style={{ padding: "9px 10px" }}><FreqBadge freq={p.freq} /></td>
      <td style={{ padding: "9px 10px" }}><EmployeBadge name={p.employe} employees={employees} /></td>
      <td style={{ padding: "9px 10px", minWidth: 110 }}><StockBar stock={calcStock(p)} /></td>
      <td style={{ padding: "9px 10px" }}><StatusChip p={p} /></td>
      <td style={{ padding: "9px 10px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <IconBtn onClick={() => onForce(p.id, !p.force_urgent)} title={p.force_urgent ? "Retirer le forçage manuel" : "Forcer dans À visiter maintenant"}
            color={p.force_urgent ? "#fff" : "#9A3412"} bg={p.force_urgent ? "#9A3412" : "#FFF7ED"} disabled={busy}>📌</IconBtn>
          <IconBtn onClick={() => onSuivi(p.id)} title="Visite faite — remet le stock à 100%" color="#1D4ED8" bg="#EFF6FF" disabled={busy}>✓</IconBtn>
          <IconBtn onClick={() => onEdit(p)} title="Modifier" color="#334155" bg="#F8FAFC" disabled={busy}>✎</IconBtn>
          <IconBtn onClick={() => onDelete(p.id)} title="Supprimer" color="#DC2626" bg="#FEF2F2" disabled={busy}>✕</IconBtn>
        </div>
      </td>
    </tr>
  );
}

function Table({ pdvList, label, employees, onSuivi, onEdit, onDelete, onForce, busy }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <TH>Magasin</TH><TH>Ville</TH><TH>Bannière</TH><TH>Fréquence</TH>
            <TH>Responsable</TH><TH>Stock</TH><TH>{label}</TH><TH>Actions</TH>
          </tr>
        </thead>
        <tbody>
          {pdvList.length === 0
            ? <tr><td colSpan={8} style={{ textAlign: "center", padding: "1.5rem", color: "#94A3B8", fontSize: 13 }}>
                Aucun PDV dans cette section
              </td></tr>
            : pdvList.map(p => <PDVRow key={p.id} p={p} employees={employees} onSuivi={onSuivi} onEdit={onEdit} onDelete={onDelete} onForce={onForce} busy={busy} />)
          }
        </tbody>
      </table>
    </div>
  );
}

function VisitConfirmModal({ open, onClose, onConfirm, employees, pdvName }) {
  const [selected, setSelected] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (open) { setSelected(""); setCustomName(""); setShowCustom(false); }
  }, [open]);

  if (!open) return null;

  const inputStyle = { width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 8,
    border: "1px solid #E2E8F0", background: "#FAFBFC", color: "#0F172A", outline: "none" };

  function handleSelectChange(e) {
    const val = e.target.value;
    if (val === "__other__") { setShowCustom(true); setSelected(""); }
    else { setShowCustom(false); setSelected(val); }
  }

  const finalName = showCustom ? customName.trim() : selected;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
      zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
        border: "1px solid #E2E8F0", padding: "1.5rem", width: 340, maxWidth: "92vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Qui a fait la visite ?</h2>
        <p style={{ fontSize: 12, color: "#64748B", marginBottom: "1rem" }}>{pdvName}</p>

        <select value={showCustom ? "__other__" : selected} onChange={handleSelectChange} style={{ ...inputStyle, marginBottom: 10 }}>
          <option value="">— Choisir —</option>
          {employees.map(e => <option key={e} value={e}>{e}</option>)}
          <option value="__other__">Autre...</option>
        </select>

        {showCustom && (
          <input value={customName} onChange={e => setCustomName(e.target.value)}
            placeholder="Nom de l'employé" autoFocus style={{ ...inputStyle, marginBottom: 10 }} />
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8,
            border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#475569", cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={() => { if (!finalName) return alert("Choisis ou entre un nom."); onConfirm(finalName); }}
            style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8, border: "1px solid #2563EB",
              background: "#2563EB", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Confirmer la visite
          </button>
        </div>
      </div>
    </div>
  );
}

function EmployeesModal({ open, onClose, employees, onSave }) {
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState("");

  useEffect(() => { if (open) setList([...employees]); }, [open, employees]);
  if (!open) return null;

  const inputStyle = { fontSize: 13, padding: "7px 10px", borderRadius: 8,
    border: "1px solid #E2E8F0", background: "#FAFBFC", color: "#0F172A", outline: "none" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
        border: "1px solid #E2E8F0", padding: "1.5rem", width: 340, maxWidth: "92vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: "1rem" }}>Gérer les employés</h2>
        <div style={{ marginBottom: 12 }}>
          {list.map((e, i) => {
            const c = employeeColor(e, list);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: 8, marginBottom: 6,
                background: c.bg, border: `1px solid ${c.border}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{e}</span>
                <button onClick={() => setList(list.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            );
          })}
          {list.length === 0 && <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", padding: "8px 0" }}>Aucun employé</p>}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Nom de l'employé"
            onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { setList([...list, newName.trim()]); setNewName(""); }}}
            style={{ ...inputStyle, flex: 1 }} />
          <button onClick={() => { if (newName.trim()) { setList([...list, newName.trim()]); setNewName(""); }}}
            style={{ fontSize: 13, padding: "7px 14px", borderRadius: 8, border: "1px solid #2563EB",
              background: "#2563EB", color: "#fff", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
            + Ajouter
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8,
            border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#475569", cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={() => onSave(list)} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8,
            border: "1px solid #2563EB", background: "#2563EB", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, onSave, initial, employees }) {
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [type, setType] = useState("IGA");
  const [freq, setFreq] = useState(7);
  const [backstock, setBackstock] = useState(false);
  const [visite, setVisite] = useState(todayStr());
  const [employe, setEmploye] = useState("");

  useEffect(() => {
    if (open) {
      setNom(initial?.nom || "");
      setVille(initial?.ville || "");
      setType(initial?.type || "IGA");
      setFreq(initial?.freq || 7);
      setBackstock(initial?.backstock || false);
      setVisite(initial?.visite || todayStr());
      setEmploye(initial?.employe || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const inputStyle = { width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 8,
    border: "1px solid #E2E8F0", background: "#FAFBFC", color: "#0F172A", outline: "none" };
  const labelStyle = { fontSize: 12, color: "#64748B", display: "block", marginBottom: 4, fontWeight: 500 };

  const FreqToggle = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 13, cursor: "pointer",
      border: `1px solid ${active ? "#3B82F6" : "#E2E8F0"}`,
      background: active ? "#EFF6FF" : "#FAFBFC",
      color: active ? "#1D4ED8" : "#64748B", fontWeight: active ? 600 : 400, transition: "all 0.15s" }}>
      {label}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14,
        border: "1px solid #E2E8F0", padding: "1.5rem", width: 360, maxWidth: "92vw",
        maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: "1rem" }}>
          {initial ? "Modifier le point de vente" : "Nouveau point de vente"}
        </h2>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Nom / Adresse</label>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: IGA Varennes" style={inputStyle} /></div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Ville</label>
          <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Ex: Varennes" style={inputStyle} /></div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Bannière</label>
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            <option>IGA</option><option>Maxi</option><option>Metro</option><option>Autre</option>
          </select></div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Responsable</label>
          <select value={employe} onChange={e => setEmploye(e.target.value)} style={inputStyle}>
            <option value="">— Non assigné —</option>
            {employees.map(e => <option key={e} value={e}>{e}</option>)}
          </select></div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Fréquence de visite</label>
          <div style={{ display: "flex", gap: 8 }}>
            <FreqToggle active={freq === 7} label="Chaque semaine" onClick={() => setFreq(7)} />
            <FreqToggle active={freq === 14} label="Aux 2 semaines" onClick={() => setFreq(14)} />
            <FreqToggle active={freq === 30} label="Mensuelle" onClick={() => setFreq(30)} />
          </div></div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px",
            borderRadius: 8, border: `1px solid ${backstock ? "#7C3AED" : "#E2E8F0"}`,
            background: backstock ? "#F5F3FF" : "#FAFBFC" }}>
            <input type="checkbox" checked={backstock} onChange={e => setBackstock(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#7C3AED", cursor: "pointer" }} />
            <span style={{ fontSize: 13, fontWeight: backstock ? 600 : 400, color: backstock ? "#5B21B6" : "#475569" }}>
              📦 Stock disponible en back-store
            </span>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}><label style={labelStyle}>Dernière visite</label>
          <input type="date" value={visite} onChange={e => setVisite(e.target.value)} style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: "1rem" }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8,
            border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#475569", cursor: "pointer" }}>
            Annuler
          </button>
          <button onClick={() => { if (!nom.trim()) return alert("Entre un nom."); onSave({ nom: nom.trim(), ville: ville.trim(), type, freq, backstock, visite, employe }); }}
            style={{ fontSize: 13, padding: "7px 16px", borderRadius: 8, border: "1px solid #2563EB",
              background: "#2563EB", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [pdvs, setPdvs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [filterFreq, setFilterFreq] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmploye, setFilterEmploye] = useState("all");
  const [connStatus, setConnStatus] = useState("Connexion...");
  const [connError, setConnError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [visitTarget, setVisitTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(null), 2500);
  }, []);

  const seedDatabase = useCallback(async () => {
    setSeeding(true);
    try {
      await supaFetch("pdvs", { method: "POST", body: JSON.stringify(SEED_PDVS), prefer: "return=minimal" });
      await supaFetch("employees", { method: "POST", body: JSON.stringify(SEED_EMPLOYEES.map(nom => ({ nom }))), prefer: "return=minimal" });
    } catch (err) {
      showToast(`Erreur d'initialisation: ${err.message}`);
    }
    setSeeding(false);
  }, [showToast]);

  const loadAll = useCallback(async () => {
    try {
      setConnError(null);
      const [pdvData, empData] = await Promise.all([
        supaFetch("pdvs?select=*&order=id.asc"),
        supaFetch("employees?select=*&order=id.asc"),
      ]);
      if ((pdvData || []).length === 0 && !seeding) {
        await seedDatabase();
        const [pdvData2, empData2] = await Promise.all([
          supaFetch("pdvs?select=*&order=id.asc"),
          supaFetch("employees?select=*&order=id.asc"),
        ]);
        setPdvs(pdvData2 || []);
        setEmployees((empData2 || []).map(e => e.nom));
        setConnStatus(`Connecté ✓ — ${(pdvData2 || []).length} PDV initialisés`);
      } else {
        setPdvs(pdvData || []);
        setEmployees((empData || []).map(e => e.nom));
        setConnStatus(`Connecté ✓ — ${(pdvData || []).length} PDV`);
      }
    } catch (err) {
      setConnError(err.message);
      setConnStatus("Erreur de connexion");
    }
    setLoaded(true);
  }, [seeding, seedDatabase]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 15s so the team sees each other's updates
  useEffect(() => {
    const interval = setInterval(() => { loadAll(); }, 15000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const filtered = pdvs.filter(p =>
    (p.nom.toLowerCase().includes(search.toLowerCase()) ||
     (p.ville || "").toLowerCase().includes(search.toLowerCase()) ||
     (p.type || "").toLowerCase().includes(search.toLowerCase()) ||
     (p.employe || "").toLowerCase().includes(search.toLowerCase())) &&
    (filterFreq === "all" || String(p.freq) === filterFreq) &&
    (filterStatus === "all" || getStatus(p) === filterStatus) &&
    (filterEmploye === "all" || (filterEmploye === "none" ? !p.employe : p.employe === filterEmploye))
  );

  const urgent = filtered.filter(p => getStatus(p) === "urgent").sort((a, b) => calcStock(a) - calcStock(b));
  const soon   = filtered.filter(p => getStatus(p) === "soon").sort((a, b) => joursAvant(a) - joursAvant(b));
  const ok     = filtered.filter(p => getStatus(p) === "ok").sort((a, b) => joursAvant(a) - joursAvant(b));

  function handleSuivi(id) {
    const p = pdvs.find(x => x.id === id);
    if (!p) return;
    setVisitTarget(p);
  }

  async function confirmVisit(employeName) {
    if (!visitTarget) return;
    setBusy(true);
    try {
      await supaFetch(`pdvs?id=eq.${visitTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({ visite: todayStr(), stock: 100, force_urgent: false, dernier_visiteur: employeName }),
      });
      showToast(`✓ ${visitTarget.nom} — visité par ${employeName}`);
      setVisitTarget(null);
      await loadAll();
    } catch (err) { showToast(`Erreur: ${err.message}`); }
    setBusy(false);
  }

  async function handleForce(id, value) {
    setBusy(true);
    try {
      await supaFetch(`pdvs?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ force_urgent: value }) });
      const p = pdvs.find(x => x.id === id);
      showToast(value ? `📌 ${p?.nom} forcé dans "À visiter maintenant"` : `📌 Forçage retiré sur ${p?.nom}`);
      await loadAll();
    } catch (err) { showToast(`Erreur: ${err.message}`); }
    setBusy(false);
  }

  async function handleDelete(id) {
    const p = pdvs.find(x => x.id === id);
    if (!p || !window.confirm(`Supprimer "${p.nom}" ?`)) return;
    setBusy(true);
    try {
      await supaFetch(`pdvs?id=eq.${id}`, { method: "DELETE" });
      showToast("PDV supprimé");
      await loadAll();
    } catch (err) { showToast(`Erreur: ${err.message}`); }
    setBusy(false);
  }

  function handleEdit(p) { setEditTarget(p); setModalOpen(true); }
  function handleAdd()   { setEditTarget(null); setModalOpen(true); }

  async function handleSave(data) {
    setBusy(true);
    try {
      if (editTarget) {
        await supaFetch(`pdvs?id=eq.${editTarget.id}`, { method: "PATCH", body: JSON.stringify(data) });
        showToast("PDV mis à jour ✓");
      } else {
        await supaFetch("pdvs", { method: "POST", body: JSON.stringify(data) });
        showToast("PDV ajouté ✓");
      }
      setModalOpen(false); setEditTarget(null);
      await loadAll();
    } catch (err) { showToast(`Erreur: ${err.message}`); }
    setBusy(false);
  }

  async function handleSaveEmployees(list) {
    setBusy(true);
    try {
      const toAdd = list.filter(n => !employees.includes(n));
      const toRemove = employees.filter(n => !list.includes(n));
      for (const nom of toAdd) {
        await supaFetch("employees", { method: "POST", body: JSON.stringify({ nom }) });
      }
      for (const nom of toRemove) {
        await supaFetch(`employees?nom=eq.${encodeURIComponent(nom)}`, { method: "DELETE" });
      }
      setEmpModalOpen(false);
      showToast("Employés mis à jour ✓");
      await loadAll();
    } catch (err) { showToast(`Erreur: ${err.message}`); }
    setBusy(false);
  }

  function exportCSV() {
    if (!pdvs.length) return alert("Aucun PDV.");
    const headers = ["Nom","Ville","Bannière","Responsable","Fréquence (jours)","Stock estimé (%)","Backstock","Dernière visite","Prochaine visite","Statut"];
    const sl = { urgent: "À visiter", soon: "Bientôt vide", ok: "OK" };
    const rows = pdvs.map(p => [`"${p.nom}"`,`"${p.ville}"`,`"${p.type}"`,`"${p.employe||""}"`,p.freq,calcStock(p),p.backstock?"Oui":"Non",p.visite,prochaineVisite(p),sl[getStatus(p)]].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="raredrank_pdv.csv"; a.click();
    URL.revokeObjectURL(url); showToast("Export CSV téléchargé ✓");
  }

  const selectStyle = { fontSize: 13, padding: "5px 10px", borderRadius: 8, border: "1px solid #E2E8F0",
    background: "#fff", color: "#334155", height: 34, cursor: "pointer" };

  if (!loaded) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", color:"#94A3B8", fontSize:14, gap:8 }}>
      <div>{seeding ? "Premier démarrage — ajout de tes 22 points de vente..." : "Connexion à la base de données..."}</div>
    </div>
  );

  if (connError) return (
    <div style={{ padding: "2rem", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "1.25rem" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#991B1B", marginBottom: 8 }}>⚠️ Erreur de connexion</div>
        <div style={{ fontSize: 13, color: "#7F1D1D", marginBottom: 12 }}>{connError}</div>
        <div style={{ fontSize: 12, color: "#991B1B" }}>Vérifie que la table "pdvs" existe bien dans Supabase et que les permissions sont configurées.</div>
        <button onClick={loadAll} style={{ marginTop: 12, fontSize: 13, padding: "7px 16px", borderRadius: 8,
          border: "1px solid #DC2626", background: "#DC2626", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Réessayer
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: "1.25rem 1rem", maxWidth: 1200, margin: "0 auto" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🥤</span>
          <span style={{ fontSize:17, fontWeight:700, color:"#0F172A" }}>RareDrank — Suivi PDV</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontSize:11, color: busy ? "#D97706" : "#16A34A", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background: busy ? "#D97706" : "#16A34A", display:"inline-block" }}></span>
            {busy ? "Sauvegarde..." : connStatus}
          </span>
          <button onClick={() => setEmpModalOpen(true)} style={{ fontSize:13, padding:"6px 14px", borderRadius:8,
            border:"1px solid #7C3AED", background:"#F5F3FF", color:"#5B21B6",
            cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            👥 Employés
          </button>
          <button onClick={exportCSV} style={{ fontSize:13, padding:"6px 14px", borderRadius:8,
            border:"1px solid #059669", background:"#059669", color:"#fff",
            cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            ↓ Exporter CSV
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))", gap:8, marginBottom:"1.25rem" }}>
        {[
          { label:"Total PDV",     value:pdvs.length,                                         color:"#0F172A" },
          { label:"À visiter",     value:pdvs.filter(p=>getStatus(p)==="urgent").length,       color:"#DC2626" },
          { label:"Cette semaine", value:pdvs.filter(p=>getStatus(p)==="soon").length,         color:"#D97706" },
          { label:"OK",            value:pdvs.filter(p=>getStatus(p)==="ok").length,           color:"#16A34A" },
          { label:"Non assignés",  value:pdvs.filter(p=>!p.employe).length,                   color:"#64748B" },
        ].map(s => (
          <div key={s.label} style={{ background:"#F8FAFC", borderRadius:10, padding:"10px 14px", border:"1px solid #F1F5F9" }}>
            <div style={{ fontSize:11, color:"#94A3B8", marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:"1rem", flexWrap:"wrap" }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Chercher PDV, ville, employé..."
          style={{ flex:1, minWidth:160, ...selectStyle, cursor:"text" }} />
        <select value={filterEmploye} onChange={e => setFilterEmploye(e.target.value)} style={selectStyle}>
          <option value="all">Tous les responsables</option>
          <option value="none">— Non assignés</option>
          {employees.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)} style={selectStyle}>
          <option value="all">Toutes fréquences</option>
          <option value="7">Chaque semaine</option>
          <option value="14">Aux 2 semaines</option>
          <option value="30">Mensuelle</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">Tous statuts</option>
          <option value="urgent">À visiter</option>
          <option value="soon">Cette semaine</option>
          <option value="ok">OK</option>
        </select>
        <button onClick={handleAdd} disabled={busy} style={{ fontSize:13, padding:"5px 14px", borderRadius:8,
          border:"1px solid #2563EB", background:"#2563EB", color:"#fff",
          cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1, fontWeight:600, height:34, display:"flex", alignItems:"center", gap:5 }}>
          + Ajouter PDV
        </button>
      </div>

      <SectionTitle icon="🔴" label="À visiter maintenant" count={urgent.length} color="#DC2626" />
      <Table pdvList={urgent} label="Statut" employees={employees} onSuivi={handleSuivi} onEdit={handleEdit} onDelete={handleDelete} onForce={handleForce} busy={busy} />

      <SectionTitle icon="🟡" label="À planifier cette semaine" count={soon.length} color="#D97706" />
      <Table pdvList={soon} label="Dans" employees={employees} onSuivi={handleSuivi} onEdit={handleEdit} onDelete={handleDelete} onForce={handleForce} busy={busy} />

      <SectionTitle icon="🟢" label="Bien stockés" count={ok.length} color="#16A34A" />
      <Table pdvList={ok} label="Prochaine visite" employees={employees} onSuivi={handleSuivi} onEdit={handleEdit} onDelete={handleDelete} onForce={handleForce} busy={busy} />

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave} initial={editTarget} employees={employees} />
      <EmployeesModal open={empModalOpen} onClose={() => setEmpModalOpen(false)}
        employees={employees} onSave={handleSaveEmployees} />
      <VisitConfirmModal open={!!visitTarget} onClose={() => setVisitTarget(null)}
        onConfirm={confirmVisit} employees={employees} pdvName={visitTarget?.nom || ""} />

      {toast && (
        <div style={{ position:"fixed", bottom:"1.25rem", right:"1.25rem", background:"#0F172A",
          color:"#fff", padding:"10px 16px", borderRadius:10, fontSize:13, fontWeight:500,
          zIndex:400, boxShadow:"0 8px 24px rgba(0,0,0,0.18)", pointerEvents:"none" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
