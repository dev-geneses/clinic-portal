"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface Item {
  id: string;
  categorie: string;
  nom: string;
  nb_seances: number;
  notes: string;
  coche: boolean;
}

interface Prescription {
  id: string;
  date: string;
  statut: string;
  notes: string;
  patient: { nom: string; prenom: string };
  items: Item[];
}

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [presc, setPresc] = useState<Prescription | null>(null);
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

      const { data } = await supabase
        .from("prescriptions")
        .select("*, patient:patients(nom,prenom), items:prescription_items(*)")
        .eq("id", id)
        .single();

      setPresc(data);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function updateStatut(statut: string) {
    const supabase = createClient();
    await supabase.from("prescriptions").update({ statut }).eq("id", id);
    setPresc(p => p ? { ...p, statut } : p);
  }

  if (loading || !role) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Chargement…</p>
    </div>
  );

  if (!presc) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Prescription introuvable.</p>
    </div>
  );

  const categories = [...new Set(presc.items.map(i => i.categorie))];

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        {/* Header */}
        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow">Prescription</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
              {presc.patient.prenom} {presc.patient.nom}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
              {new Date(presc.date).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span className={`chip ${presc.statut === "validee" ? "chip-active" : presc.statut === "archivee" ? "chip-done" : "chip-draft"}`}>
              {presc.statut}
            </span>
            {role !== "infirmiere" && presc.statut === "brouillon" && (
              <button className="btn btn-primary btn-sm" onClick={() => updateStatut("validee")}>
                Valider
              </button>
            )}
            {role !== "infirmiere" && presc.statut === "validee" && (
              <a href={`/offre/nouvelle?prescription=${id}`} className="btn btn-secondary btn-sm">
                Créer une offre →
              </a>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/prescription")}>
              ← Retour
            </button>
          </div>
        </div>

        {/* Notes */}
        {presc.notes && (
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem", background: "var(--accent-light)", border: "1px solid rgba(184,118,42,0.2)" }}>
            <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Notes</p>
            <p style={{ fontSize: "0.9rem" }}>{presc.notes}</p>
          </div>
        )}

        {/* Items par catégorie */}
        {categories.map(cat => (
          <div key={cat} className="card" style={{ padding: "1.25rem", marginBottom: "0.85rem" }}>
            <p style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand)" }}>
              {cat}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {presc.items.filter(i => i.categorie === cat).map(item => (
                <div key={item.id} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "0.6rem",
                  background: "var(--surface-alt)",
                }}>
                  <span style={{ color: "var(--brand)", fontSize: "1rem", marginTop: "0.1rem" }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.nom}</div>
                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.2rem" }}>
                      {item.nb_seances > 1 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{item.nb_seances} séances</span>
                      )}
                      {item.notes && (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>{item.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {presc.items.length === 0 && (
          <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            Aucune prestation dans cette prescription.
          </div>
        )}

      </main>
    </div>
  );
}