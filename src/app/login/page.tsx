"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Role } from "@/types";

const ROLES: { role: Role; label: string; color: string; icon: string; email: string }[] = [
  { role: "professeur",  label: "Professeur",  color: "role-professeur",  icon: "🔬", email: "prof.dr.dantoine@genesesclinic.com" },
  { role: "financier",   label: "Financier",   color: "role-financier",   icon: "💼", email: "finance@genesesclinic.com" },
  { role: "admin",       label: "Admin",       color: "role-admin",       icon: "📋", email: "info@genesesclinic.com" },
  { role: "infirmiere",  label: "Infirmière",  color: "role-infirmiere",  icon: "🩺", email: "nurse@genesesclinic.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function selectRole(r: typeof ROLES[0]) {
    setSelected(r.role);
    setEmail(r.email);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
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
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  onClick={() => selectRole(r)}
                  className={`role-badge ${r.color}`}
                  type="button"
                  style={{
                    padding: "0.65rem 0.75rem",
                    borderRadius: "0.7rem",
                    cursor: "pointer",
                    border: selected === r.role ? "2px solid currentColor" : "2px solid transparent",
                    fontSize: "0.8rem",
                    justifyContent: "flex-start",
                    gap: "0.5rem",
                    transition: "all 120ms ease",
                    opacity: selected && selected !== r.role ? 0.5 : 1,
                  }}
                >
                  <span>{r.icon}</span> {r.label}
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
              <div style={{ position: "relative" }}>
                <input
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "var(--muted)", padding: 0 }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: "var(--danger)", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!email || !password || loading}
              style={{ width: "100%", justifyContent: "center", opacity: (!email || !password || loading) ? 0.6 : 1 }}
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
