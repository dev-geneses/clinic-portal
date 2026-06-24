import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geneses Clinic — Portail interne",
  description: "Outil de gestion des prescriptions, offres et plannings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
