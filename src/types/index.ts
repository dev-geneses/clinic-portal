export type Role = "professeur" | "financier" | "admin" | "infirmiere";

export interface User {
  id: string;
  email: string;
  role: Role;
  nom: string;
}

export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  notes?: string;
  created_at: string;
}

export interface Prestation {
  id: string;
  categorie: string;
  nom: string;
  description?: string;
  duree_minutes?: number;
  prix_defaut?: number;
  actif: boolean;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  prestation_id: string;
  prestation?: Prestation;
  nb_seances?: number;
  notes?: string;
  coche: boolean;
}

export interface Prescription {
  id: string;
  patient_id: string;
  patient?: Patient;
  date: string;
  notes?: string;
  statut: "brouillon" | "validee" | "archivee";
  items?: PrescriptionItem[];
  created_by: string;
  created_at: string;
}

export interface OffreItem {
  id: string;
  offre_id: string;
  prescription_item_id?: string;
  prestation_id: string;
  prestation?: Prestation;
  nb_seances: number;
  prix_unitaire: number;
  notes?: string;
}

export interface Offre {
  id: string;
  prescription_id: string;
  prescription?: Prescription;
  patient_id: string;
  patient?: Patient;
  date: string;
  validite_jours: number;
  notes?: string;
  statut: "brouillon" | "envoyee" | "acceptee" | "refusee";
  items?: OffreItem[];
  created_by: string;
  created_at: string;
}

export interface PlanningItem {
  id: string;
  planning_id: string;
  prescription_item_id?: string;
  offre_item_id?: string;
  prestation_id: string;
  prestation?: Prestation;
  patient_id: string;
  patient?: Patient;
  date: string;
  heure_debut: string;
  heure_fin?: string;
  statut: "planifie" | "confirme" | "realise" | "annule";
  notes?: string;
}

export interface Planning {
  id: string;
  patient_id: string;
  patient?: Patient;
  prescription_id?: string;
  items?: PlanningItem[];
  created_at: string;
}
