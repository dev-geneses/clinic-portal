"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role, Offre } from "@/types";

export default function OffrePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("role,nom").eq("id", user.id).single();
      if (!profile) { router.push("/login"); return; }

      const r = profile.role as Role;
      if (r === "infirmiere") { router.push("/dashboard"); return; }

      setRole(r);
      setNom(profile.nom);

      const { data } = await supabase
        .from("offres")
        .select("*, patient:patients(id,nom,prenom), items:offre_items(id,nom,nb_seances,prix_unitaire)")
        .order("date", { ascending: false });

      setOffres(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  function total(offre: Offre) {
    return (offre.items ?? []).reduce((s, i) => s + (i.nb_seances * i.prix_unitaire), 0);
  }

  if (loading || !role) return (
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
            <p className="eyebrow">Gestion financière</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Offres</h1>
          </div>
          <a href="/offre/nouvelle" className="btn btn-secondary">+ Nouvelle offre</a>
        </div>

        <div className="card">
          {offres.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "2rem" }}>💶</div>
              <p>Aucune offre créée</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Validité</th>
                    <th>Total CHF</th>
                    <th>Statut</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {offres.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{o.patient?.prenom} {o.patient?.nom}</td>
                      <td style={{ color: "var(--muted)" }}>{new Date(o.date).toLocaleDateString("fr-CH")}</td>
                      <td style={{ color: "var(--muted)" }}>{o.validite_jours}j</td>
                      <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                        {total(o).toLocaleString("fr-CH", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`chip ${
                          o.statut === "acceptee" ? "chip-done" :
                          o.statut === "envoyee" ? "chip-active" :
                          o.statut === "refusee" ? "chip-cancelled" : "chip-draft"
                        }`}>{o.statut}</span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                        {o.notes ?? "—"}
                      </td>
                      <td>
                        <a href={`/offre/${o.id}`} className="btn btn-ghost btn-sm">Ouvrir →</a>
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
