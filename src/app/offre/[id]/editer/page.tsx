"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface Item { id: string; nom: string; categorie: string; nb_seances: number; prix_unitaire: number; notes: string; }

export default function EditerOffrePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [patientNom, setPatientNom] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [validite, setValidite] = useState(30);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
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

      const { data } = await supabase
        .from("offres")
        .select("*, patient:patients(nom,prenom), items:offre_items(*)")
        .eq("id", id)
        .single();

      if (!data || data.statut !== "brouillon") { router.push(`/offre/${id}`); return; }

      setPatientNom(`${data.patient.prenom} ${data.patient.nom}`);
      setItems(data.items ?? []);
      setValidite(data.validite_jours);
      setNotes(data.notes ?? "");
      setLoading(false);
    }
    load();
  }, [id, router]);

  function updateItem(itemId: string, field: keyof Item, value: any) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  }

  const total = items.reduce((s, i) => s + i.nb_seances * i.prix_unitaire, 0);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    await supabase.from("offres").update({ validite_jours: validite, notes }).eq("id", id);

    for (const item of items) {
      await supabase.from("offre_items")
        .update({ nb_seances: item.nb_seances, prix_unitaire: item.prix_unitaire, notes: item.notes })
        .eq("id", item.id);
    }

    router.push(`/offre/${id}`);
  }

  if (loading || !role) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Chargement…</p>
    </div>
  );

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow">Modifier l'offre</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{patientNom}</h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-ghost" onClick={() => router.back()}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="field-group">
              <label className="field-label">Validité (jours)</label>
              <input className="field-input" type="number" min={1} value={validite} onChange={e => setValidite(parseInt(e.target.value))} />
            </div>
            <div className="field-group">
              <label className="field-label">Notes</label>
              <input className="field-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Conditions particulières…" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Prestations & prix</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 130px 100px 1fr", gap: "0.75rem", padding: "0.4rem 0.75rem" }}>
              <span className="field-label">Prestation</span>
              <span className="field-label" style={{ textAlign: "center" }}>Séances</span>
              <span className="field-label" style={{ textAlign: "right" }}>Prix unit. CHF</span>
              <span className="field-label" style={{ textAlign: "right" }}>Total CHF</span>
              <span className="field-label">Notes</span>
            </div>

            {items.map(item => (
              <div key={item.id} style={{
                display: "grid", gridTemplateColumns: "2fr 80px 130px 100px 1fr",
                gap: "0.75rem", alignItems: "center",
                padding: "0.65rem 0.75rem", borderRadius: "0.65rem",
                background: "var(--surface-alt)", border: "1px solid var(--stroke-light)",
              }}>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.nom}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{item.categorie}</div>
                </div>
                <input className="field-input" type="number" min={1} value={item.nb_seances}
                  onChange={e => updateItem(item.id, "nb_seances", parseInt(e.target.value) || 1)}
                  style={{ textAlign: "center", padding: "0.4rem 0.5rem" }} />
                <input className="field-input" type="number" min={0} step={10} value={item.prix_unitaire}
                  onChange={e => updateItem(item.id, "prix_unitaire", parseFloat(e.target.value) || 0)}
                  style={{ textAlign: "right", padding: "0.4rem 0.6rem" }} />
                <div style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>
                  {(item.nb_seances * item.prix_unitaire).toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
                </div>
                <input className="field-input" value={item.notes}
                  onChange={e => updateItem(item.id, "notes", e.target.value)}
                  placeholder="Remarque…" style={{ padding: "0.4rem 0.6rem", fontSize: "0.82rem" }} />
              </div>
            ))}
          </div>

          <hr className="divider" />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ textAlign: "right" }}>
              <div className="field-label">Total CHF</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>
                {total.toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
