"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface Patient { id: string; nom: string; prenom: string; date_naissance?: string; notes?: string; }
interface Prescription { id: string; date: string; statut: string; notes?: string; }
interface Offre { id: string; date: string; statut: string; validite_jours: number; }
interface PlanItem { id: string; date: string; heure_debut: string; nom_prestation: string; categorie: string; statut: string; }

const DOSSIER_STATUTS = [
  { key: "prescription", label: "Prescription créée" },
  { key: "offre_envoyee", label: "Offre envoyée" },
  { key: "offre_acceptee", label: "Offre acceptée" },
  { key: "soins_planifies", label: "Soins planifiés" },
  { key: "restitution", label: "Restitution" },
  { key: "suivi", label: "Suivi en cours" },
];

function getDossierStatut(prescriptions: Prescription[], offres: Offre[], soins: PlanItem[]): string {
  if (soins.some(s => s.statut === "realise")) return "restitution";
  if (soins.length > 0) return "soins_planifies";
  if (offres.some(o => o.statut === "acceptee")) return "offre_acceptee";
  if (offres.some(o => o.statut === "envoyee")) return "offre_envoyee";
  if (prescriptions.length > 0) return "prescription";
  return "";
}

export default function PatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [offres, setOffres] = useState<Offre[]>([]);
  const [soins, setSoins] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role,nom").eq("id", user.id).single();
      if (!profile) { router.push("/login"); return; }
      setRole(profile.role as Role);
      setNom(profile.nom);

      const [patRes, prescRes, offreRes, soinRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", patientId).single(),
        supabase.from("prescriptions").select("id,date,statut,notes").eq("patient_id", patientId).order("date", { ascending: false }),
        supabase.from("offres").select("id,date,statut,validite_jours").eq("patient_id", patientId).order("date", { ascending: false }),
        supabase.from("planning_items").select("id,date,heure_debut,nom_prestation,categorie,statut").eq("patient_id", patientId).order("date"),
      ]);

      setPatient(patRes.data ?? null);
      setPrescriptions(prescRes.data ?? []);
      setOffres(offreRes.data ?? []);
      setSoins(soinRes.data ?? []);
      setLoading(false);
    }
    load();
  }, [router, patientId]);

  if (loading || !role) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Chargement…</p>
    </div>
  );

  if (!patient) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Patient introuvable.</p>
    </div>
  );

  const statut = getDossierStatut(prescriptions, offres, soins);
  const statutIndex = DOSSIER_STATUTS.findIndex(s => s.key === statut);

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        {/* Header patient */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow">Dossier patient</p>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0.25rem 0 0.5rem" }}>
            {patient.prenom} {patient.nom}
          </h1>
          {patient.date_naissance && (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              Né(e) le {new Date(patient.date_naissance).toLocaleDateString("fr-CH")}
            </p>
          )}
          {patient.notes && (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem", fontStyle: "italic" }}>{patient.notes}</p>
          )}
        </div>

        {/* Timeline statut dossier */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1.25rem" }}>Statut du dossier</p>
          <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
            {DOSSIER_STATUTS.map((s, i) => {
              const done = i < statutIndex;
              const active = i === statutIndex;
              const color = done ? "var(--brand)" : active ? "var(--accent)" : "var(--stroke)";
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: "80px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: done ? "var(--brand)" : active ? "var(--accent)" : "var(--surface-alt)",
                      border: `2px solid ${color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 800,
                      color: done || active ? "#fff" : "var(--muted)",
                      flexShrink: 0,
                    }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <div style={{
                      fontSize: "0.65rem", fontWeight: active ? 700 : 500,
                      color: active ? "var(--accent)" : done ? "var(--brand)" : "var(--muted)",
                      textAlign: "center", marginTop: "0.4rem", lineHeight: 1.3,
                    }}>
                      {s.label}
                    </div>
                  </div>
                  {i < DOSSIER_STATUTS.length - 1 && (
                    <div style={{ height: "2px", flex: 1, background: done ? "var(--brand)" : "var(--stroke-light)", marginBottom: "1.2rem", minWidth: "16px" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

          {/* Prescriptions */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <p className="eyebrow">Prescriptions</p>
              <a href="/prescription/nouveau" className="btn btn-ghost btn-sm">+ Nouvelle</a>
            </div>
            {prescriptions.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Aucune prescription</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {prescriptions.map(p => (
                  <a key={p.id} href={`/prescription/${p.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ padding: "0.65rem 0.75rem", borderRadius: "0.6rem", border: "1px solid var(--stroke-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>
                        {new Date(p.date).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className={`chip ${p.statut === "validee" ? "chip-done" : p.statut === "archivee" ? "chip-cancelled" : "chip-draft"}`}>{p.statut}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Offres */}
          {role !== "infirmiere" && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <p className="eyebrow">Offres financières</p>
                <a href="/offre/nouvelle" className="btn btn-ghost btn-sm">+ Nouvelle</a>
              </div>
              {offres.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Aucune offre</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {offres.map(o => (
                    <a key={o.id} href={`/offre/${o.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ padding: "0.65rem 0.75rem", borderRadius: "0.6rem", border: "1px solid var(--stroke-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground)" }}>
                          {new Date(o.date).toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className={`chip ${o.statut === "acceptee" ? "chip-done" : o.statut === "envoyee" ? "chip-active" : o.statut === "refusee" ? "chip-cancelled" : "chip-draft"}`}>{o.statut}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Soins planifiés */}
        <div className="card" style={{ padding: "1.25rem", marginTop: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <p className="eyebrow">Soins planifiés</p>
            <a href="/planning/nouveau" className="btn btn-ghost btn-sm">+ Ajouter</a>
          </div>
          {soins.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Aucun soin planifié</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Soin</th>
                    <th>Catégorie</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {soins.map(s => (
                    <tr key={s.id}>
                      <td>{new Date(s.date).toLocaleDateString("fr-CH", { weekday: "short", day: "numeric", month: "short" })}</td>
                      <td style={{ fontWeight: 600 }}>{s.heure_debut}</td>
                      <td style={{ fontWeight: 600 }}>{s.nom_prestation}</td>
                      <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{s.categorie}</td>
                      <td>
                        <span className={`chip ${s.statut === "realise" ? "chip-done" : s.statut === "confirme" ? "chip-active" : s.statut === "annule" ? "chip-cancelled" : "chip-draft"}`}>
                          {s.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
