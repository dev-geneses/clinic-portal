# CLAUDE.md — Geneses Clinic Portal

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il contient tout le contexte nécessaire pour reprendre le travail sans briefing.

---

## Contexte projet

**Client** : Geneses Clinic SA — Centre de médecine interne et préventive  
**Adresse** : Rue du lac 36, 1815 Clarens (VD), Suisse  
**Directeur médical** : Pr Thierry Dantoine  
**Chef de projet** : Dana Jude (consultante indépendante, Primo Medical SA)  
**Mandat** : Transition opérationnelle + transformation numérique — 6 mois dès 15.06.2026

**Objectif du portail** : Remplacer les échanges informels (email, papier) par un outil de coordination interne couvrant prescriptions, offres financières, planning des soins et suivi des tâches par patient.

---

## Stack technique

| Composant | Choix | Version |
|-----------|-------|---------|
| Framework | Next.js | 16.2.4 |
| Langage | TypeScript | 5.x |
| Style | Tailwind CSS | v4 |
| Base de données | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| Déploiement | Vercel | — |
| Repo | GitHub (dev-geneses) | — |

**URLs**
- Production : `https://clinic-portal-two-pi.vercel.app`
- Supabase : `https://sqrespdqxwoobhwdpgsw.supabase.co`
- GitHub : `https://github.com/dev-geneses/clinic-portal`
- Vercel : `https://vercel.com/geneses1`

---

## Design tokens

```css
--background: #f4f1ea      /* crème */
--brand:      #1a5c4f      /* vert foncé */
--accent:     #b8762a      /* or */
--foreground: #0d1b2a      /* quasi-noir */
--muted:      #6b7280      /* gris */
```

Inspiré de `portal-primomedical` (repo privé Dana Jude).

---

## Rôles et accès

| Rôle | Prescriptions | Offres & Prix | Planning | Tâches |
|------|:---:|:---:|:---:|:---:|
| professeur | ✅ | ✅ | ✅ | ✅ |
| financier | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| infirmiere | ✅ | ❌ | ✅ | ✅ |

RLS Supabase enforced côté base — pas seulement côté UI.

---

## Utilisateurs en base (profiles)

| Nom | Rôle | Email |
|-----|------|-------|
| Thierry Dantoine | professeur | prof.dr.dantoine@genesesclinic.com |
| — | financier | — |
| — | admin | info@genesesclinic.com |
| — | infirmiere | — |

---

## Conventions de code

- Toutes les pages : `"use client"` + auth check via `supabase.auth.getUser()`
- Redirect si non authentifié : `router.push("/login")`
- Infirmière redirigée vers `/dashboard` si elle accède à `/offre`
- Styles : CSS variables uniquement, pas de classes Tailwind hardcodées
- Commits : `feat:`, `fix:`, `chore:`, `docs:`

---

## Structure des fichiers

```
src/
  app/
    login/              ✅ Connexion par rôle
    dashboard/          ✅ Tableau de bord + stats
    prescription/
      page.tsx          ✅ Liste prescriptions
      nouveau/          ✅ Nouvelle prescription (template complet)
      [id]/             ✅ Détail prescription
    offre/
      page.tsx          ✅ Liste offres (masqué infirmière)
      nouvelle/         ✅ Nouvelle offre depuis prescription
      [id]/             ✅ Détail offre + statuts
    planning/
      page.tsx          ✅ Vue semaine + liste
      nouveau/          ❌ À coder
      [id]/             ❌ À coder
  components/
    layout/Topbar.tsx   ✅ Navigation + rôle + déconnexion
  lib/supabase.ts       ✅ Client Supabase browser
  types/index.ts        ✅ Types TypeScript
```

---

## Prochaines priorités

1. `planning/nouveau` — formulaire ajout soin
2. `planning/[id]` — édition soin planifié
3. Module catalogue — page de gestion des prestations
4. Module panier — offre depuis catalogue avec marges auto
5. Module tâches — assignation + signature par rôle
6. Vue patient — historique + timeline
7. Export PDF offre

