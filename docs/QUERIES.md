# QUERIES.md — Historique des queries SQL

> Toutes les queries exécutées en production, avec nom, date et description.

---

## [GC-DB-001] Schéma initial
**Date** : 2026-06-24  
**Fichier** : `supabase_schema.sql`  
**Description** : Création de toutes les tables initiales (profiles, patients, prescriptions, prescription_items, offres, offre_items, planning_items) + RLS + trigger auto-profil.  
**Résultat** : ✅ Succès

---

## [GC-DB-002] Suppression trigger bugué
**Date** : 2026-06-24  
**Query** :
```sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();
```
**Description** : Le trigger créait une erreur 500 lors de la création des utilisateurs. Supprimé — les profils sont insérés manuellement.  
**Résultat** : ✅ Succès

---

## [GC-DB-003] Insertion profils utilisateurs
**Date** : 2026-06-24  
**Query** :
```sql
insert into profiles (id, nom, role) values
  ('640694d9-...', 'Thierry Dantoine', 'professeur'),
  ('52507f3d-...', 'Financier', 'financier'),
  ('455d79c8-...', 'Admin', 'admin'),
  ('c50ece34-...', 'Infirmière', 'infirmiere');
```
**Description** : Création des 4 profils utilisateurs.  
**Résultat** : ✅ Succès

---

## [GC-DB-004] Correction RLS policies
**Date** : 2026-06-24  
**Description** : Les policies initiales causaient une récursion infinie (500 error). Remplacées par des policies simples sans sous-requête sur `profiles`.  
**Résultat** : ✅ Succès — login fonctionnel

---

## [GC-DB-005] Correction RLS toutes tables
**Date** : 2026-06-25  
**Description** : Réécriture de toutes les policies pour éviter la récursion. Pattern : `auth.uid() in (select id from profiles)`.  
**Résultat** : ✅ Succès

---

## [GC-DB-006] Création table catalogue_prestations
**Date** : 2026-06-25  
**Description** : Table avec structure JSONB pour les tarifs (extensible : etranger, suisse_prive, swiss_lamal, suisse_mixte).  
**Résultat** : ✅ Succès

---

## [GC-DB-007] Insertion catalogue prestations v1.0
**Date** : 2026-06-25  
**Fichier** : `catalogue_insert.sql`  
**Description** : ~170 prestations issues des Tarifs 2026 ETR. 8 catégories : Thérapies & Machines, Tests Fonctionnels, Pr Dantoine, Médecine Complémentaire, Épigénétique, Génétique, Biologie Fonctionnelle, Perfusions (Précieux/Vitamines/Acides Aminés/Packs/Autres), Homéopathie, Radiologie.  
**Données manquantes** : prix_cout pour perfusions (non disponible dans les fichiers sources).  
**Résultat** : ✅ Succès

