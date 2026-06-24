"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role, Prescription } from "@/types";

export default function PrescriptionPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
        .select("*, patient:patients(id,nom,prenom)")
        .order("date", { ascending: false });

      setPrescriptions(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = prescriptions.filter(p => {
    const q = search.toLowerCase();
    return (
      p.patient?.nom?.toLowerCase().includes(q) ||
      p.patient?.prenom?.toLowerCase().includes(q) ||
      p.statut?.includes(q)
    );
  });

  if (loading || !role) return (
    <div className="clinic-root" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <p style={{ color:"var(--muted)" }}>Chargement…</p>
    </div>
  );

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        <div className="section-header">
          <div>
            <p className="eyebrow">Gestion</p>
            <h1 className="section-title" style={{ fontSize: "1.5rem", fontWeight: 800 }}>Prescriptions</h1>
          </div>
          <a href="/prescription/nouveau" className="btn btn-primary">+ Nouvelle</a>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem" }}>
          <input
            className="field-input"
            style={{ maxWidth: "360px" }}
            placeholder="Rechercher un patient…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "2rem" }}>📋</div>
              <p>Aucune prescription trouvée</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(rx => (
                    <tr key={rx.id}>
                      <td style={{ fontWeight: 600 }}>
                        {rx.patient?.prenom} {rx.patient?.nom}
                      </td>
                      <td style={{ color: "var(--muted)" }}>
                        {new Date(rx.date).toLocaleDateString("fr-CH")}
                      </td>
                      <td>
                        <span className={`chip ${rx.statut === "validee" ? "chip-active" : rx.statut === "archivee" ? "chip-done" : "chip-draft"}`}>
                          {rx.statut}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.82rem", maxWidth: "200px" }}>
                        {rx.notes ? <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{rx.notes}</span> : "—"}
                      </td>
                      <td>
                        <a href={`/prescription/${rx.id}`} className="btn btn-ghost btn-sm">
                          Ouvrir →
                        </a>
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
