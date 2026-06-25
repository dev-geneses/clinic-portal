"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface OffreItem {
  id: string;
  categorie: string;
  nom: string;
  nb_seances: number;
  prix_unitaire: number;
  notes: string;
}

interface Offre {
  id: string;
  date: string;
  statut: string;
  notes: string;
  validite_jours: number;
  patient: { nom: string; prenom: string };
  items: OffreItem[];
}

export default function OffreDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [offre, setOffre] = useState<Offre | null>(null);
  const [loading, setLoading] = useState(true);

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

      setOffre(data);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function updateStatut(statut: string) {
    const supabase = createClient();
    await supabase.from("offres").update({ statut }).eq("id", id);
    setOffre(o => o ? { ...o, statut } : o);
  }

  const total = offre?.items.reduce((s, i) => s + i.nb_seances * i.prix_unitaire, 0) ?? 0;

  if (loading || !role) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Chargement…</p>
    </div>
  );

  if (!offre) return (
    <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--muted)" }}>Offre introuvable.</p>
    </div>
  );

  const categories = [...new Set(offre.items.map(i => i.categorie))];

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        <div className="section-header" style={{ marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow">Offre financière</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
              {offre.patient.prenom} {offre.patient.nom}
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.3rem" }}>
              {new Date(offre.date).toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })} · Validité {offre.validite_jours} jours
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className={`chip ${offre.statut === "acceptee" ? "chip-done" : offre.statut === "envoyee" ? "chip-active" : offre.statut === "refusee" ? "chip-cancelled" : "chip-draft"}`}>
              {offre.statut}
            </span>
            {offre.statut === "brouillon" && (
              <button className="btn btn-primary btn-sm" onClick={() => updateStatut("envoyee")}>
                Marquer envoyée
              </button>
            )}
            {offre.statut === "envoyee" && (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => updateStatut("acceptee")}>
                  ✓ Acceptée
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => updateStatut("refusee")}>
                  ✗ Refusée
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/offre")}>
              ← Retour
            </button>
          </div>
        </div>

        {/* Notes */}
        {offre.notes && (
          <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem", background: "var(--accent-light)", border: "1px solid rgba(184,118,42,0.2)" }}>
            <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Notes</p>
            <p style={{ fontSize: "0.9rem" }}>{offre.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Prestations</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 120px 100px", gap: "0.75rem", padding: "0.4rem 0.75rem" }}>
              <span className="field-label">Prestation</span>
              <span className="field-label" style={{ textAlign: "center" }}>Séances</span>
              <span className="field-label" style={{ textAlign: "right" }}>Prix unit.</span>
              <span className="field-label" style={{ textAlign: "right" }}>Total CHF</span>
            </div>

            {categories.map(cat => (
              <div key={cat}>
                <div style={{ padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {cat}
                </div>
                {offre.items.filter(i => i.categorie === cat).map(item => (
                  <div key={item.id} style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 80px 120px 100px",
                    gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.55rem",
                    background: "var(--surface-alt)",
                    marginBottom: "0.3rem",
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{item.nom}</div>
                      {item.notes && <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontStyle: "italic" }}>{item.notes}</div>}
                    </div>
                    <div style={{ textAlign: "center", fontSize: "0.875rem" }}>{item.nb_seances}x</div>
                    <div style={{ textAlign: "right", fontSize: "0.875rem" }}>
                      {item.prix_unitaire.toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>
                      {(item.nb_seances * item.prix_unitaire).toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
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