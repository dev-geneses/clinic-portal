# SCHEMA.md — Base de données Supabase

> Projet : sqrespdqxwoobhwdpgsw  
> Région : Frankfurt (eu-west-1)  
> Mis à jour : 2026-06-25

---

## Tables

### `profiles`
Liée à `auth.users`. Créée manuellement (trigger supprimé car bug).

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | = auth.users.id |
| nom | text | Prénom Nom |
| role | text | professeur / financier / admin / infirmiere |
| created_at | timestamptz | — |

### `patients`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| nom | text | En majuscules |
| prenom | text | — |
| date_naissance | date | Optionnel |
| notes | text | Observations générales |
| created_at | timestamptz | — |

### `prescriptions`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| patient_id | uuid FK | → patients |
| date | date | — |
| notes | text | Notes générales |
| statut | text | brouillon / validee / archivee |
| created_by | uuid FK | → auth.users |
| created_at | timestamptz | — |

### `prescription_items`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| prescription_id | uuid FK | → prescriptions |
| categorie | text | Ex: "Thérapies & Machines" |
| nom | text | Nom de la prestation |
| nb_seances | integer | Default 1 |
| notes | text | Notes spécifiques |
| coche | boolean | True = prescrit |
| created_at | timestamptz | — |

### `offres`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| prescription_id | uuid FK | → prescriptions (optionnel) |
| patient_id | uuid FK | → patients |
| date | date | — |
| validite_jours | integer | Default 30 |
| notes | text | — |
| statut | text | brouillon / envoyee / acceptee / refusee |
| created_by | uuid FK | → auth.users |
| created_at | timestamptz | — |

**RLS** : infirmiere exclue (role != 'infirmiere')

### `offre_items`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| offre_id | uuid FK | → offres |
| prescription_item_id | uuid FK | → prescription_items (optionnel) |
| categorie | text | — |
| nom | text | — |
| nb_seances | integer | — |
| prix_unitaire | numeric(10,2) | Saisi manuellement |
| notes | text | — |

**RLS** : infirmiere exclue

### `planning_items`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| prescription_id | uuid FK | Optionnel |
| prescription_item_id | uuid FK | Optionnel |
| patient_id | uuid FK | → patients |
| date | date | — |
| heure_debut | time | — |
| heure_fin | time | Optionnel |
| nom_prestation | text | — |
| categorie | text | — |
| statut | text | planifie / confirme / realise / annule |
| notes | text | — |
| created_by | uuid FK | → auth.users |
| created_at | timestamptz | — |

### `catalogue_prestations`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | — |
| categorie | text | Ex: "Perfusions" |
| sous_categorie | text | Ex: "Vitamines" |
| nom | text | Nom complet |
| description | text | Optionnel |
| duree_minutes | integer | Optionnel |
| tarifs | jsonb | Voir structure ci-dessous |
| actif | boolean | Default true |
| ordre | integer | Pour le tri |
| created_at | timestamptz | — |

**Structure tarifs JSONB** :
```json
{
  "etranger": { "prix_vente": 575, "prix_cout": 430 },
  "suisse_prive": { "prix_vente": null, "prix_cout": null },
  "swiss_lamal": { "prix_vente": null, "prix_cout": null },
  "suisse_mixte": { "prix_vente": null, "prix_cout": null }
}
```

---

## Tables à créer (prochaine session)

### `taches` (à venir)
```sql
create table taches (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references patients(id),
  titre text not null,
  description text,
  statut text default 'a_faire' check (statut in ('a_faire','en_cours','executee')),
  role_assignee text,
  user_assignee uuid references auth.users(id),
  signe_par uuid references auth.users(id),
  date_echeance date,
  date_execution timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

