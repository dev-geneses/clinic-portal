"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface PlanItem {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin?: string;
  statut: string;
  notes?: string;
  nom_prestation: string;
  categorie: string;
  patient_nom: string;
  patient_prenom: string;
}

const STATUT_COLORS: Record<string, string> = {
  planifie: "chip-draft",
  confirme: "chip-active",
  realise: "chip-done",
  annule: "chip-cancelled",
};

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function PlanningPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const days = getWeekDays(weekStart);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role,nom").eq("id", user.id).single();
      if (!profile) { router.push("/login"); return; }
      setRole(profile.role as Role);
      setNom(profile.nom);
    }
    loadUser();
  }, [router]);

  useEffect(() => {
    if (!role) return;
    async function loadItems() {
      setLoading(true);
      const supabase = createClient();
      const from = weekStart.toISOString().split("T")[0];
      const to = days[6].toISOString().split("T")[0];

      const { data } = await supabase
        .from("planning_items")
        .select("*, patient:patients(nom,prenom)")
        .gte("date", from)
        .lte("date", to)
        .order("heure_debut");

      setItems((data ?? []).map((i: any) => ({
        ...i,
        patient_nom: i.patient?.nom ?? "",
        patient_prenom: i.patient?.prenom ?? "",
      })));
      setLoading(false);
    }
    loadItems();
  }, [role, weekStart]);

  function prevWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  }

  function nextWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  }

  function itemsForDay(day: Date) {
    const key = day.toISOString().split("T")[0];
    return items.filter(i => i.date === key);
  }

  const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  if (!role) return (
    <div className="clinic-root" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <p style={{ color:"var(--muted)" }}>Chargement…</p>
    </div>
  );

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        <div className="section-header" style={{ marginBottom: "1.25rem" }}>
          <div>
            <p className="eyebrow">Coordination</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>Planning des soins</h1>
          </div>
          <a href="/planning/nouveau" className="btn btn-primary">+ Ajouter un soin</a>
        </div>

        {/* Week navigator */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <button className="btn btn-ghost btn-sm" onClick={prevWeek}>← Semaine préc.</button>
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
            Semaine du {weekStart.toLocaleDateString("fr-CH", { day: "numeric", month: "long" })} au {days[6].toLocaleDateString("fr-CH", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={nextWeek}>Semaine suiv. →</button>
        </div>

        {/* Week grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
          {days.map((day, i) => {
            const dayItems = itemsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className="card card-sm" style={{ padding: "0.75rem", minHeight: "180px" }}>
                <div style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: isToday ? "var(--brand)" : "var(--muted)",
                  marginBottom: "0.1rem",
                }}>
                  {DAY_NAMES[i]}
                </div>
                <div style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: isToday ? "var(--brand)" : "var(--foreground)",
                  marginBottom: "0.75rem",
                  lineHeight: 1,
                }}>
                  {day.getDate()}
                </div>

                {loading ? (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>…</div>
                ) : dayItems.length === 0 ? (
                  <div style={{ fontSize: "0.72rem", color: "var(--stroke)", textAlign: "center", marginTop: "1rem" }}>—</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {dayItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: "0.4rem 0.5rem",
                          borderRadius: "0.45rem",
                          background: "var(--brand-light)",
                          fontSize: "0.72rem",
                          lineHeight: 1.4,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--brand)" }}>{item.heure_debut}</div>
                        <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{item.patient_prenom} {item.patient_nom}</div>
                        <div style={{ color: "var(--muted)" }}>{item.nom_prestation}</div>
                        {item.notes && <div style={{ color: "var(--muted)", fontStyle: "italic", marginTop: "0.2rem" }}>{item.notes}</div>}
                        <span className={`chip ${STATUT_COLORS[item.statut] ?? "chip-draft"}`} style={{ marginTop: "0.3rem" }}>{item.statut}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* List view below */}
        <div className="card" style={{ padding: "1.5rem", marginTop: "1.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Détail de la semaine</p>
          {loading ? (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Chargement…</p>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "2rem" }}>🗓</div>
              <p>Aucun soin planifié cette semaine</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Patient</th>
                    <th>Soin</th>
                    <th>Statut</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.date).toLocaleDateString("fr-CH", { weekday: "short", day: "numeric", month: "short" })}</td>
                      <td style={{ fontWeight: 600 }}>{item.heure_debut}{item.heure_fin ? `–${item.heure_fin}` : ""}</td>
                      <td style={{ fontWeight: 600 }}>{item.patient_prenom} {item.patient_nom}</td>
                      <td>
                        <div>{item.nom_prestation}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{item.categorie}</div>
                      </td>
                      <td><span className={`chip ${STATUT_COLORS[item.statut] ?? "chip-draft"}`}>{item.statut}</span></td>
                      <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{item.notes ?? "—"}</td>
                      <td>
                        <a href={`/planning/${item.id}`} className="btn btn-ghost btn-sm">Éditer</a>
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
