"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Role } from "@/types";

const ROLE_LABELS: Record<Role, string> = {
  professeur: "Professeur",
  financier: "Financier",
  admin: "Admin",
  infirmiere: "Infirmière",
};

const NAV_LINKS = [
  { href: "/dashboard",    label: "Tableau de bord", roles: ["professeur","financier","admin","infirmiere"] },
  { href: "/prescription", label: "Prescriptions",   roles: ["professeur","financier","admin","infirmiere"] },
  { href: "/offre",        label: "Offres",           roles: ["professeur","financier","admin"] },
  { href: "/planning",     label: "Planning",         roles: ["professeur","financier","admin","infirmiere"] },
];

interface TopbarProps {
  role: Role;
  nom: string;
}

export function Topbar({ role, nom }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleLinks = NAV_LINKS.filter(l => l.roles.includes(role));

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <div className="topbar-logo">
          Geneses <span>Clinic</span>
        </div>
        <nav style={{ display: "flex", gap: "0.15rem" }}>
          {visibleLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "0.55rem",
                fontSize: "0.875rem",
                fontWeight: pathname.startsWith(link.href) ? 600 : 400,
                color: pathname.startsWith(link.href) ? "var(--brand)" : "var(--muted)",
                background: pathname.startsWith(link.href) ? "var(--brand-light)" : "transparent",
                textDecoration: "none",
                transition: "all 120ms ease",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span className={`role-badge role-${role}`}>
          {ROLE_LABELS[role]}
        </span>
        <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{nom}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
