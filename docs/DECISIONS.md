# DECISIONS.md — Journal des décisions techniques

> Pourquoi on a fait tel ou tel choix. Utile pour ne pas refaire les mêmes erreurs.

---

## 2026-06-24

### Next.js 16 + TypeScript
**Contexte** : Choix du framework pour le portail.  
**Décision** : Même stack que `portal-primomedical` (projet Dana Jude).  
**Raison** : Cohérence, réutilisation des patterns, Dana connaît déjà.

### Supabase vs localStorage
**Contexte** : Persistance des données pour le prototype.  
**Décision** : Supabase dès le départ.  
**Raison** : 4 utilisateurs simultanés sur des appareils différents — localStorage ne fonctionne que sur un seul appareil.

### Compte GitHub/Vercel/Supabase clinique (dev-geneses)
**Contexte** : Dana avait atteint la limite de projets Supabase sur son compte perso.  
**Décision** : Nouveau compte clinique pour tout héberger.  
**Raison** : Plus propre pour le transfert futur à l'équipe clinique. Dana peut transférer les repos GitHub en 2 clics.

### RLS Supabase pour les prix
**Contexte** : L'infirmière ne doit pas voir les prix.  
**Décision** : RLS enforced côté base sur `offres` et `offre_items`.  
**Raison** : La sécurité UI seule n'est pas suffisante — un utilisateur technique pourrait contourner. RLS = sécurité au niveau de la base.

---

## 2026-06-25

### Tarifs en JSONB
**Contexte** : La clinique a des tarifs différents selon la nationalité du patient (étrangers, Suisses privé, LAMAL, mixte).  
**Décision** : Colonne `tarifs jsonb` dans `catalogue_prestations`.  
**Raison** : Évite de créer une table séparée ou d'ajouter des colonnes. Extensible sans migration. Structure : `{"etranger": {"prix_vente": 575, "prix_cout": 430}, "suisse_prive": {...}}`.

### Trigger auto-profil supprimé
**Contexte** : Le trigger `on_auth_user_created` causait une erreur 500 lors de la création des utilisateurs.  
**Décision** : Supprimé — profils insérés manuellement via SQL.  
**Raison** : Le trigger essayait de lire `raw_user_meta_data` qui n'était pas fourni par le formulaire Supabase Dashboard. À réintroduire plus tard si on crée les utilisateurs via API.

### Sélection du rôle au login (UI uniquement)
**Contexte** : Le rôle est affiché visuellement au login.  
**Décision** : La sélection du rôle au login est purement UX — le vrai rôle vient de la table `profiles` après authentification.  
**Raison** : Sécurité. L'utilisateur ne peut pas choisir son propre rôle.

