"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface Patient { id: string; nom: string; prenom: string; date_naissance?: string; notes?: string; }

export default function PatientsPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
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
      const { data } = await supabase.from("patients").select("*").order("nom");
      setPatients(data ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = patients.filter(p =>
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase())
  );

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
            <p className="eyebrow">Dossiers</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Patients</h1>
          </div>
          <input
            className="field-input"
            style={{ width: "220px" }}
            placeholder="Rechercher un patient…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "2rem" }}>👤</div>
              <p>{patients.length === 0 ? "Aucun patient enregistré" : "Aucun résultat"}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Date de naissance</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.nom}</td>
                      <td>{p.prenom}</td>
                      <td style={{ color: "var(--muted)" }}>
                        {p.date_naissance ? new Date(p.date_naissance).toLocaleDateString("fr-CH") : "—"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{p.notes ?? "—"}</td>
                      <td>
                        <a href={`/patient/${p.id}`} className="btn btn-ghost btn-sm">Voir dossier →</a>
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
