"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Role } from "@/types";

const ROLES: { role: Role; label: string; color: string; icon: string }[] = [
  { role: "professeur",  label: "Professeur",  color: "role-professeur",  icon: "🔬" },
  { role: "financier",   label: "Financier",   color: "role-financier",   icon: "💼" },
  { role: "admin",       label: "Admin",       color: "role-admin",       icon: "📋" },
  { role: "infirmiere",  label: "Infirmière",  color: "role-infirmiere",  icon: "🩺" },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Identifiants incorrects.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="clinic-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Portail interne</p>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            Geneses Clinic
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.4rem" }}>
            Clarens, Vaud — Médecine préventive
          </p>
        </div>

        <div className="card" style={{ padding: "1.75rem" }}>
          {/* Role selector */}
          <div style={{ marginBottom: "1.5rem" }}>
            <p className="field-label" style={{ marginBottom: "0.75rem" }}>Votre rôle</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {ROLES.map(({ role, label, color, icon }) => (
                <button
                  key={role}
                  onClick={() => setSelected(role)}
                  className={`role-badge ${color}`}
                  type="button"
                  style={{
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.7rem",
                    cursor: "pointer",
                    border: selected === role ? "2px solid currentColor" : "2px solid transparent",
                    fontSize: "0.8rem",
                    justifyContent: "flex-start",
                    gap: "0.5rem",
                    transition: "all 120ms ease",
                    opacity: selected && selected !== role ? 0.5 : 1,
                  }}
                >
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input
                className="field-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="prenom.nom@genesesclinic.ch"
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Mot de passe</label>
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selected || loading}
              style={{ width: "100%", justifyContent: "center", opacity: (!selected || loading) ? 0.6 : 1 }}
            >
              {loading ? "Connexion…" : "Accéder au portail"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--muted)" }}>
          Geneses Clinic · Accès réservé au personnel
        </p>
      </div>
    </div>
  );
}
