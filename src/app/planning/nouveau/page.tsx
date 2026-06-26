"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

const SOINS_COURANTS = [
  { nom: "Prélèvement sanguin", categorie: "Biologie" },
  { nom: "Prélèvement urinaire", categorie: "Biologie" },
  { nom: "Consultation Pr Dantoine", categorie: "Consultation" },
  { nom: "Contrôle médical", categorie: "Consultation" },
  { nom: "Zoom restitution", categorie: "Téléconsultation" },
  { nom: "Restitution en cabinet", categorie: "Consultation" },
  { nom: "Perfusion IV", categorie: "Thérapies" },
  { nom: "ECG", categorie: "Tests fonctionnels" },
  { nom: "Analyse composition corporelle", categorie: "Tests fonctionnels" },
  { nom: "Injection", categorie: "Thérapies" },
];

export default function NouveauSoinPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [userId, setUserId] = useState("");
  const [patients, setPatients] = useState<{ id: string; nom: string; prenom: string }[]>([]);

  const [patientId, setPatientId] = useState("");
  const [soinSelection, setSoinSelection] = useState("");
  const [nomPrestation, setNomPrestation] = useState("");
  const [categorie, setCategorie] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [heureDebut, setHeureDebut] = useState("09:00");
  const [heureFin, setHeureFin] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role,nom").eq("id", user.id).single();
      if (!profile) { router.push("/login"); return; }
      setRole(profile.role as Role);
      setNom(profile.nom);
      setUserId(user.id);

      const { data } = await supabase.from("patients").select("id,nom,prenom").order("nom");
      setPatients(data ?? []);
    }
    load();
  }, [router]);

  function handleSoinSelect(value: string) {
    setSoinSelection(value);
    if (value === "__autre__") {
      setNomPrestation("");
      setCategorie("");
    } else {
      const found = SOINS_COURANTS.find(s => s.nom === value);
      if (found) {
        setNomPrestation(found.nom);
        setCategorie(found.categorie);
      }
    }
  }

  async function handleSave() {
    if (!patientId || !nomPrestation || !date || !heureDebut) {
      alert("Veuillez remplir les champs obligatoires.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("planning_items").insert({
      patient_id: patientId,
      nom_prestation: nomPrestation,
      categorie,
      date,
      heure_debut: heureDebut,
      heure_fin: heureFin || null,
      notes: notes || null,
      statut: "planifie",
      created_by: userId,
    });

    if (error) { alert("Erreur lors de l'enregistrement."); setSaving(false); return; }
    router.push("/planning");
  }

  if (!role) return (
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
            <p className="eyebrow">Planning des soins</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Ajouter un soin</h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-ghost" onClick={() => router.back()}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem", maxWidth: "600px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            <div className="field-group">
              <label className="field-label">Patient *</label>
              <select className="field-input" value={patientId} onChange={e => setPatientId(e.target.value)}>
                <option value="">— Sélectionner un patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Type de soin *</label>
              <select className="field-input" value={soinSelection} onChange={e => handleSoinSelect(e.target.value)}>
                <option value="">— Sélectionner —</option>
                {SOINS_COURANTS.map(s => (
                  <option key={s.nom} value={s.nom}>{s.nom}</option>
                ))}
                <option value="__autre__">Autre…</option>
              </select>
            </div>

            {soinSelection === "__autre__" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="field-group">
                  <label className="field-label">Nom du soin *</label>
                  <input className="field-input" value={nomPrestation} onChange={e => setNomPrestation(e.target.value)} placeholder="Ex: Bilan hormonal" />
                </div>
                <div className="field-group">
                  <label className="field-label">Catégorie</label>
                  <input className="field-input" value={categorie} onChange={e => setCategorie(e.target.value)} placeholder="Ex: Biologie" />
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="field-group">
                <label className="field-label">Date *</label>
                <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Heure début *</label>
                <input className="field-input" type="time" value={heureDebut} onChange={e => setHeureDebut(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Heure fin</label>
                <input className="field-input" type="time" value={heureFin} onChange={e => setHeureFin(e.target.value)} />
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Notes</label>
              <input className="field-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions particulières…" />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
