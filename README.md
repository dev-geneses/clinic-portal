# Geneses Clinic — Portail interne

Outil de gestion des prescriptions, offres et plannings.  
Stack : Next.js 16 · TypeScript · Tailwind v4 · Supabase

---

## Setup

### 1. Variables d'environnement

Copier `.env.local.example` → `.env.local` et remplir :

```
NEXT_PUBLIC_SUPABASE_URL=https://sqrespdqxwoobhwdpgsw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Sur Vercel : ajouter ces deux variables dans Settings → Environment Variables.

### 2. Base de données Supabase

Dans Supabase → SQL Editor → exécuter le contenu de `supabase_schema.sql`.

### 3. Créer les utilisateurs

Dans Supabase → Authentication → Users → Invite user.  
Le trigger crée automatiquement le profil. Pour définir le rôle, passer par :

```sql
update profiles set role = 'infirmiere', nom = 'Prénom Nom' where id = '<user_id>';
```

Rôles disponibles : `professeur` · `financier` · `admin` · `infirmiere`

### 4. Lancer en dev

```bash
npm install
npm run dev
```

---

## Accès par rôle

| Fonctionnalité | Professeur | Financier | Admin | Infirmière |
|----------------|:---:|:---:|:---:|:---:|
| Prescriptions | ✅ | ✅ | ✅ | ✅ |
| Offres & prix | ✅ | ✅ | ✅ | ❌ |
| Planning | ✅ | ✅ | ✅ | ✅ |

---

## Structure

```
src/
  app/
    login/          → Connexion
    dashboard/      → Tableau de bord
    prescription/   → Liste + nouvelle prescription
    offre/          → Liste + nouvelle offre (prix)
    planning/       → Planning semaine
  components/
    layout/Topbar   → Navigation + rôle
  lib/supabase.ts   → Client Supabase
  types/index.ts    → Types TypeScript
```
