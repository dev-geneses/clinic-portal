"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import type { Role } from "@/types";

interface Stats {
  patients: number;
  prescriptions: number;
  offres: number;
  planning_semaine: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [nom, setNom] = useState("");
  const [stats, setStats] = useState<Stats>({ patients: 0, prescriptions: 0, offres: 0, planning_semaine: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Get user profile with role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, nom")
        .eq("id", user.id)
        .single();

      if (!profile) { router.push("/login"); return; }

      setRole(profile.role as Role);
      setNom(profile.nom);

      // Fetch stats
      const [p, rx, o] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("prescriptions").select("id", { count: "exact", head: true }),
        supabase.from("offres").select("id", { count: "exact", head: true }),
      ]);

      // Planning cette semaine
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const { count: planCount } = await supabase
        .from("planning_items")
        .select("id", { count: "exact", head: true })
        .gte("date", monday.toISOString().split("T")[0])
        .lte("date", sunday.toISOString().split("T")[0]);

      setStats({
        patients: p.count ?? 0,
        prescriptions: rx.count ?? 0,
        offres: o.count ?? 0,
        planning_semaine: planCount ?? 0,
      });

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !role) {
    return (
      <div className="clinic-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--muted)" }}>Chargement…</p>
      </div>
    );
  }

  const STAT_CARDS = [
    { label: "Patients", value: stats.patients, href: "/prescription", icon: "👤", visible: true },
    { label: "Prescriptions", value: stats.prescriptions, href: "/prescription", icon: "📋", visible: true },
    { label: "Offres", value: stats.offres, href: "/offre", icon: "💶", visible: role !== "infirmiere" },
    { label: "Soins cette semaine", value: stats.planning_semaine, href: "/planning", icon: "🗓", visible: true },
  ];

  return (
    <div className="clinic-root">
      <Topbar role={role} nom={nom} />
      <main className="clinic-main" style={{ paddingTop: "1.5rem" }}>

        {/* Hero */}
        <div className="card" style={{ padding: "1.5rem 1.75rem", marginBottom: "1.25rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>Tableau de bord</p>
          <h1 style={{ fontSize: "clamp(1.4rem, 2.4vw, 1.8rem)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            Bonjour, {nom.split(" ")[0]}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.4rem" }}>
            {new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
          {STAT_CARDS.filter(c => c.visible).map(card => (
            <a
              key={card.label}
              href={card.href}
              className="card card-sm"
              style={{ padding: "1.25rem", textDecoration: "none", display: "block", transition: "transform 120ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{card.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--brand)", lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: "0.35rem" }}>{card.label}</div>
            </a>
          ))}
        </div>

        {/* Quick actions */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Actions rapides</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href="/prescription/nouveau" className="btn btn-primary">
              + Nouvelle prescription
            </a>
            {role !== "infirmiere" && (
              <a href="/offre/nouvelle" className="btn btn-secondary">
                + Nouvelle offre
              </a>
            )}
            <a href="/planning" className="btn btn-ghost">
              Voir le planning
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
