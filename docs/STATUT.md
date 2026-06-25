# STATUT.md — État des modules

> Mis à jour : 2026-06-25 — Semaine 2 du mandat

---

## Modules déployés ✅

### AUTH + LOGIN
- Connexion email/password via Supabase Auth
- Sélection du rôle au login (visuel uniquement — le vrai rôle vient de la DB)
- RLS enforced sur toutes les tables
- **Date** : 2026-06-24

### DASHBOARD
- Stats temps réel : patients, prescriptions, offres, soins semaine
- Actions rapides selon rôle
- **Date** : 2026-06-24

### PRESCRIPTIONS
- Liste avec recherche
- Nouvelle prescription : template complet (9 catégories, cases à cocher, séances, notes)
- Détail : vue par catégorie, validation, lien vers offre
- **Date** : 2026-06-24 / 2026-06-25

### OFFRES
- Liste (masquée infirmière par RLS)
- Nouvelle offre depuis prescription : saisie manuelle des prix, calcul total
- Détail : tableau par catégorie, total, gestion statuts (brouillon → envoyée → acceptée/refusée)
- **Date** : 2026-06-25

### PLANNING
- Vue semaine (navigation prev/next)
- Liste détaillée de la semaine
- **Date** : 2026-06-24

### CATALOGUE
- Table `catalogue_prestations` créée
- ~170 prestations insérées (tarifs 2026 ETR)
- Structure JSON extensible : etranger / suisse_prive / swiss_lamal / suisse_mixte
- **Date** : 2026-06-25

---

## En cours 🔄

### PLANNING — pages manquantes
- `planning/nouveau` — formulaire ajout soin au planning
- `planning/[id]` — édition + changement statut

---

## À coder ❌

### MODULE PANIER
- Offre depuis catalogue (pas seulement depuis prescription)
- Calcul automatique marge (prix_vente - prix_cout)
- Discount par ligne
- Sélection du tarif (etranger / suisse_prive / etc.)

### MODULE TÂCHES
- Table `taches` à créer
- Assignation par rôle
- Statuts : à faire → en cours → exécutée
- Signature par initiale colorée (P=vert, F=or, A=bleu, I=violet)

### VUE PATIENT
- Fiche patient complète
- Timeline : prescriptions → offres → soins → tâches
- Statut global du séjour

### EXPORT PDF OFFRE
- Template PDF Geneses Clinic
- Généré depuis la page détail offre

### PROTOCOLES
- Bibliothèque de protocoles standards par type de soin
- Check-list préparation infirmière

---

## Décisions techniques prises

| Date | Décision | Raison |
|------|----------|--------|
| 2026-06-24 | Next.js 16 + TypeScript | Cohérence avec portal-primomedical |
| 2026-06-24 | Supabase (pas localStorage) | Multi-utilisateurs simultanés |
| 2026-06-24 | RLS Supabase pour les prix | Infirmière ne voit pas les prix |
| 2026-06-25 | Tarifs en JSONB | Extensible sans migration de schema |
| 2026-06-25 | Compte GitHub/Vercel/Supabase clinique | Transfert propre à terme |

