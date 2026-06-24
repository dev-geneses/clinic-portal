"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface PrescItem {
  id: string;
  categorie: string;
  nom: string;
  nb_seances: number;
  notes: string;
}

interface OffreItem extends PrescItem {
  prix_unitaire: number;
  inclus: boolean;
  offre_notes: string;
}

export default function NewOffrePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [userId, setUserId] = useState("");

  const [prescriptions, setPrescriptions] = useState<{ id: string; patient_nom: string; patient_prenom: string; date: string }[]>([]);
  const [prescId, setPrescId] = useState("");
  const [items, setItems] = useState<OffreItem[]>([]);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [validite, setValidite] = useState(30);
  const [offreNotes, setOffreNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role,nom").eq("id", user.id).single();
      if (!profile || profile.role === "infirmiere") { router.push("/dashboard"); return; }
      setRole(profile.role as Role);
      setNom(profile.nom);
      setUserId(user.id);

      const { data } = await supabase
        .from("prescriptions")
        .select("id, date, patient:patients(nom,prenom)")
        .order("date", { ascending: false });

      setPrescriptions((data ?? []).map((p: any) => ({
        id: p.id,
        date: p.date,
        patient_nom: p.patient?.nom ?? "",
        patient_prenom: p.patient?.prenom ?? "",
      })));
    }
    load();
  }, [router]);

  async function loadPrescItems(id: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("prescription_items")
      .select("id,categorie,nom,nb_seances,notes")
      .eq("prescription_id", id)
      .eq("coche", true);

    setItems((data ?? []).map(i => ({
      ...i,
      prix_unitaire: 0,
      inclus: true,
      offre_notes: "",
    })));
  }

  function updateItem(id: string, field: keyof OffreItem, value: any) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  const included = items.filter(i => i.inclus);
  const total = included.reduce((s, i) => s + (i.nb_seances * i.prix_unitaire), 0);

  async function handleSave() {
    if (!prescId) { alert("Sélectionnez une prescription"); return; }
    setSaving(true);
    const supabase = createClient();

    const presc = prescriptions.find(p => p.id === prescId);

    // Get patient id
    const { data: prescData } = await supabase.from("prescriptions").select("patient_id").eq("id", prescId).single();
    if (!prescData) { setSaving(false); return; }

    const { data: offre, error } = await supabase
      .from("offres")
      .insert({
        prescription_id: prescId,
        patient_id: prescData.patient_id,
        date,
        validite_jours: validite,
        notes: offreNotes,
        statut: "brouillon",
        created_by: userId,
      })
      .select()
      .single();

    if (error || !offre) { setSaving(false); alert("Erreur création offre"); return; }

    const offreItems = included.map(i => ({
      offre_id: offre.id,
      prescription_item_id: i.id,
      nom: i.nom,
      categorie: i.categorie,
      nb_seances: i.nb_seances,
      prix_unitaire: i.prix_unitaire,
      notes: i.offre_notes,
    }));

    if (offreItems.length > 0) {
      await supabase.from("offre_items").insert(offreItems);
    }

    router.push(`/offre/${offre.id}`);
  }

  if (!role) return (
    <div className="clinic-root" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <p style={{ color:"var(--muted)" }}>Chargement…</p>
    </div>
  );

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow">Offre financière</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Nouvelle offre</h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-ghost" onClick={() => router.back()}>Annuler</button>
            <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Informations</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>

            <div className="field-group" style={{ gridColumn: "1 / -1" }}>
              <label className="field-label">Prescription source</label>
              <select
                className="field-input"
                value={prescId}
                onChange={e => { setPrescId(e.target.value); loadPrescItems(e.target.value); }}
              >
                <option value="">— Sélectionner une prescription —</option>
                {prescriptions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.patient_nom} {p.patient_prenom} — {new Date(p.date).toLocaleDateString("fr-CH")}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Date offre</label>
              <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label">Validité (jours)</label>
              <input className="field-input" type="number" min={1} value={validite} onChange={e => setValidite(parseInt(e.target.value))} />
            </div>

            <div className="field-group">
              <label className="field-label">Notes</label>
              <input className="field-input" value={offreNotes} onChange={e => setOffreNotes(e.target.value)} placeholder="Conditions particulières…" />
            </div>
          </div>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <p className="eyebrow" style={{ marginBottom: "1rem" }}>Prestations & prix</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 120px 100px 1fr", gap: "0.75rem", padding: "0.4rem 0.75rem" }}>
                <span className="field-label">Prestation</span>
                <span className="field-label" style={{ textAlign: "center" }}>Séances</span>
                <span className="field-label" style={{ textAlign: "right" }}>Prix unit. CHF</span>
                <span className="field-label" style={{ textAlign: "right" }}>Total CHF</span>
                <span className="field-label">Notes</span>
              </div>

              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 80px 120px 100px 1fr",
                    gap: "0.75rem",
                    alignItems: "center",
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.65rem",
                    background: item.inclus ? "var(--surface-alt)" : "transparent",
                    opacity: item.inclus ? 1 : 0.45,
                    border: "1px solid var(--stroke-light)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={item.inclus}
                      onChange={e => updateItem(item.id, "inclus", e.target.checked)}
                      style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.nom}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{item.categorie}</div>
                    </div>
                  </div>

                  <input
                    className="field-input"
                    type="number"
                    min={1}
                    value={item.nb_seances}
                    onChange={e => updateItem(item.id, "nb_seances", parseInt(e.target.value) || 1)}
                    style={{ textAlign: "center", padding: "0.4rem 0.5rem" }}
                  />

                  <input
                    className="field-input"
                    type="number"
                    min={0}
                    step={10}
                    value={item.prix_unitaire}
                    onChange={e => updateItem(item.id, "prix_unitaire", parseFloat(e.target.value) || 0)}
                    style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}
                    placeholder="0.00"
                  />

                  <div style={{ textAlign: "right", fontWeight: 700, fontSize: "0.9rem", color: "var(--accent)" }}>
                    {(item.nb_seances * item.prix_unitaire).toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
                  </div>

                  <input
                    className="field-input"
                    value={item.offre_notes}
                    onChange={e => updateItem(item.id, "offre_notes", e.target.value)}
                    placeholder="Remarque…"
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.82rem" }}
                  />
                </div>
              ))}
            </div>

            {/* Total */}
            <hr className="divider" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "2rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                {included.length} prestation{included.length > 1 ? "s" : ""}
              </span>
              <div style={{ textAlign: "right" }}>
                <div className="field-label">Total CHF</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent)" }}>
                  {total.toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {prescId && items.length === 0 && (
          <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Aucune prestation cochée dans cette prescription.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>Annuler</button>
          <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer l'offre"}
          </button>
        </div>

      </main>
    </div>
  );
}
