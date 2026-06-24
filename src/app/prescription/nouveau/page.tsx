"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

// ── Prescription template from Geneses Clinic form ──
const CATEGORIES = [
  {
    key: "therapies",
    label: "Thérapies",
    icon: "💧",
    items: [
      "Hydrothérapie du côlon",
      "Ozone thérapie IV",
      "Balnéothérapie / Bain Céleste",
      "Bain Japonais",
      "Bain Kneipp",
    ],
    has_seances: true,
  },
  {
    key: "traits_fonctionnels",
    label: "Traits Fonctionnels",
    icon: "📊",
    items: [
      "Cardioscope",
      "Calorimétrie",
      "Ostéopathie",
      "Analyse posturale",
    ],
    has_seances: true,
  },
  {
    key: "bacterial",
    label: "Bactérial / Laxatif",
    icon: "🧫",
    items: [
      "Probiotiques (oral)",
      "Probiotiques (IV/IM)",
      "Microbiome analyse",
      "Lavement",
    ],
    has_seances: false,
  },
  {
    key: "urines",
    label: "Urines",
    icon: "🧪",
    items: [
      "HMPG",
      "Acide organique urinaire",
      "Métaux lourds urinaires",
      "Profil hormonal urinaire",
    ],
    has_seances: false,
  },
  {
    key: "biologie",
    label: "Biologie Fonctionnelle MDD",
    icon: "🔬",
    items: [
      "Bilan métabolique complet",
      "Micronutriments / Vitamines",
      "Bilan hormonal complet",
      "Cycle Mélatonine",
      "Allergies / Intolérances alimentaires",
      "Panel PARKINSON / Neurodégénératif",
      "Panel AUTO-IMMUN",
      "Panel CARDIOVASCULAIRE",
      "Métaux lourds sanguins",
      "Acides gras essentiels",
      "Profil oxydatif",
      "Bilan thyroïdien complet",
    ],
    has_seances: false,
  },
  {
    key: "genetique",
    label: "Génétique MDD",
    icon: "🧬",
    items: [
      "ADN / ARN",
      "DTC (Direct-to-Consumer)",
      "MTHFR",
      "Microbiome génomique",
      "Nutrigenomics",
      "Pharmacogenomics",
      "Retardation / Panel gènes",
    ],
    has_seances: false,
  },
  {
    key: "epigenetique",
    label: "Épigénétique",
    icon: "✨",
    items: [
      "NOR / Imagerie cellulaire",
      "Thérapie cellulaire",
      "siRNA",
      "Frutal / Nutrition frugale",
      "Intention thérapeutique",
    ],
    has_seances: false,
  },
  {
    key: "medecines_comp",
    label: "Médecines Complémentaires",
    icon: "🌿",
    items: [
      "Hydrolyse",
      "Ozone (local)",
      "Acupuncture",
      "Homéopathie",
    ],
    has_seances: true,
  },
  {
    key: "diagnostique",
    label: "Diagnostique",
    icon: "🖥",
    items: [
      "ICI (Imagerie cellulaire in vivo)",
      "Bilan nutritionnel PS",
      "Plaque PS",
      "DITI (Thermographie)",
      "Biorésonance",
      "Vision digitale",
    ],
    has_seances: false,
  },
];

interface ItemState {
  coche: boolean;
  nb_seances: number;
  notes: string;
}

type FormState = Record<string, Record<string, ItemState>>;

function initForm(): FormState {
  const state: FormState = {};
  for (const cat of CATEGORIES) {
    state[cat.key] = {};
    for (const item of cat.items) {
      state[cat.key][item] = { coche: false, nb_seances: 1, notes: "" };
    }
  }
  return state;
}

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [patients, setPatients] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  const [patientId, setPatientId] = useState("");
  const [newPatientNom, setNewPatientNom] = useState("");
  const [newPatientPrenom, setNewPatientPrenom] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [prescNotes, setPrescNotes] = useState("");
  const [form, setForm] = useState<FormState>(initForm());
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data: profile } = await supabase.from("profiles").select("role,nom").eq("id", user.id).single();
      if (!profile) { router.push("/login"); return; }
      setRole(profile.role as Role);
      setNom(profile.nom);

      const { data: pts } = await supabase.from("patients").select("id,nom,prenom").order("nom");
      setPatients(pts ?? []);
    }
    load();
  }, [router]);

  function toggleItem(catKey: string, itemName: string) {
    setForm(f => ({
      ...f,
      [catKey]: {
        ...f[catKey],
        [itemName]: { ...f[catKey][itemName], coche: !f[catKey][itemName].coche },
      },
    }));
  }

  function updateItem(catKey: string, itemName: string, field: "nb_seances" | "notes", value: string | number) {
    setForm(f => ({
      ...f,
      [catKey]: {
        ...f[catKey],
        [itemName]: { ...f[catKey][itemName], [field]: value },
      },
    }));
  }

  async function handleSave() {
    const supabase = createClient();
    setSaving(true);

    let pid = patientId;

    // Create new patient if needed
    if (isNewPatient) {
      const { data: newPt, error } = await supabase
        .from("patients")
        .insert({ nom: newPatientNom.toUpperCase(), prenom: newPatientPrenom })
        .select()
        .single();
      if (error || !newPt) { setSaving(false); alert("Erreur création patient"); return; }
      pid = newPt.id;
    }

    if (!pid) { setSaving(false); alert("Sélectionnez un patient"); return; }

    // Create prescription
    const { data: presc, error: prescError } = await supabase
      .from("prescriptions")
      .insert({ patient_id: pid, date, notes: prescNotes, statut: "brouillon", created_by: userId })
      .select()
      .single();

    if (prescError || !presc) { setSaving(false); alert("Erreur création prescription"); return; }

    // Create items (only checked ones)
    const items: {
      prescription_id: string;
      categorie: string;
      nom: string;
      nb_seances: number;
      notes: string;
      coche: boolean;
    }[] = [];

    for (const cat of CATEGORIES) {
      for (const itemName of cat.items) {
        const state = form[cat.key][itemName];
        if (state.coche) {
          items.push({
            prescription_id: presc.id,
            categorie: cat.label,
            nom: itemName,
            nb_seances: state.nb_seances,
            notes: state.notes,
            coche: true,
          });
        }
      }
    }

    if (items.length > 0) {
      await supabase.from("prescription_items").insert(items);
    }

    router.push(`/prescription/${presc.id}`);
  }

  const checkedCount = CATEGORIES.flatMap(c => Object.values(form[c.key])).filter(i => i.coche).length;

  if (!role) return (
    <div className="clinic-root" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <p style={{ color:"var(--muted)" }}>Chargement…</p>
    </div>
  );

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        {/* Header */}
        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow">Prescription</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Nouvelle prescription</h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {checkedCount > 0 && (
              <span className="chip chip-active">{checkedCount} élément{checkedCount > 1 ? "s" : ""}</span>
            )}
            <button className="btn btn-ghost" onClick={() => router.back()}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Patient + meta */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Patient & informations</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

            <div className="field-group" style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", cursor: "pointer", fontSize: "0.875rem" }}>
                  <input type="radio" checked={!isNewPatient} onChange={() => setIsNewPatient(false)} />
                  Patient existant
                </label>
                <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", cursor: "pointer", fontSize: "0.875rem" }}>
                  <input type="radio" checked={isNewPatient} onChange={() => setIsNewPatient(true)} />
                  Nouveau patient
                </label>
              </div>
            </div>

            {!isNewPatient ? (
              <div className="field-group" style={{ gridColumn: "1 / -1" }}>
                <label className="field-label">Patient</label>
                <select className="field-input" value={patientId} onChange={e => setPatientId(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="field-group">
                  <label className="field-label">Nom</label>
                  <input className="field-input" value={newPatientNom} onChange={e => setNewPatientNom(e.target.value)} placeholder="DUPONT" />
                </div>
                <div className="field-group">
                  <label className="field-label">Prénom</label>
                  <input className="field-input" value={newPatientPrenom} onChange={e => setNewPatientPrenom(e.target.value)} placeholder="Marie" />
                </div>
              </>
            )}

            <div className="field-group">
              <label className="field-label">Date</label>
              <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label">Notes générales</label>
              <input className="field-input" value={prescNotes} onChange={e => setPrescNotes(e.target.value)} placeholder="Observations, contexte…" />
            </div>
          </div>
        </div>

        {/* Prescription categories */}
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="card" style={{ padding: "1.25rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{cat.icon}</span> {cat.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {cat.items.map(itemName => {
                const state = form[cat.key][itemName];
                return (
                  <div
                    key={itemName}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      borderRadius: "0.65rem",
                      background: state.coche ? "var(--brand-light)" : "transparent",
                      border: state.coche ? "1px solid rgba(26,92,79,0.2)" : "1px solid transparent",
                      transition: "all 120ms ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={state.coche}
                      onChange={() => toggleItem(cat.key, itemName)}
                      style={{ marginTop: "0.15rem", accentColor: "var(--brand)", width: "1rem", height: "1rem", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        style={{ fontSize: "0.875rem", fontWeight: state.coche ? 600 : 400, cursor: "pointer", color: state.coche ? "var(--brand-strong)" : "var(--foreground)" }}
                        onClick={() => toggleItem(cat.key, itemName)}
                      >
                        {itemName}
                      </span>

                      {state.coche && (
                        <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                          {cat.has_seances && (
                            <div className="field-group" style={{ minWidth: "100px" }}>
                              <label className="field-label">Séances</label>
                              <input
                                className="field-input"
                                type="number"
                                min={1}
                                max={99}
                                value={state.nb_seances}
                                onChange={e => updateItem(cat.key, itemName, "nb_seances", parseInt(e.target.value) || 1)}
                                style={{ padding: "0.4rem 0.6rem" }}
                              />
                            </div>
                          )}
                          <div className="field-group" style={{ flex: 1, minWidth: "180px" }}>
                            <label className="field-label">Notes</label>
                            <input
                              className="field-input"
                              value={state.notes}
                              onChange={e => updateItem(cat.key, itemName, "notes", e.target.value)}
                              placeholder="Précisions…"
                              style={{ padding: "0.4rem 0.6rem" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom save */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : `Enregistrer${checkedCount > 0 ? ` (${checkedCount} éléments)` : ""}`}
          </button>
        </div>

      </main>
    </div>
  );
}
