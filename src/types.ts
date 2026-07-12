/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Wilaya {
  idWilaya: number;
  code: number;
  nom: string;
  utilisateur: boolean; // true if added by user, false if preloaded
  zone: 'Nord' | 'Sud'; // Added in Avenant N°1
}

export interface Bareme {
  idBareme: number;
  nom?: string; // Nom personnalisé du barème
  // Deprecated fields kept for backward compatibility if needed, but we focus on new ones
  montantRepas?: number;
  montantNuitee?: number;
  forfaitJournalier?: number;

  // New fields Avenant N°1
  montantRepasNord: number;
  montantRepasSud: number;
  montantNuiteeNord: number;
  montantNuiteeSud: number;
  forfaitJournalierNord: number;
  forfaitJournalierSud: number;

  indemniteKilometrique: number;
  dateDebutValidite: string; // YYYY-MM-DD
  dateFinValidite?: string;  // YYYY-MM-DD (optional)
  actif: boolean;
}

export interface JourFerie {
  idJourFerie: number;
  date: string; // MM-DD for fixed, YYYY-MM-DD for mobile
  libelle: string;
  type: 'Fixe' | 'Mobile';
}

export interface Mission {
  idMission: number;
  numeroOrdre?: string;
  wilayaId: number;
  dateDepart: string; // YYYY-MM-DD
  heureDepart: string; // HH:mm
  dateRetour: string; // YYYY-MM-DD
  heureRetour: string; // HH:mm
  typeTransport: 'Véhicule personnel' | 'Tous moyens';
  kilometrage: number;
  montantTransport: number;
  typePriseCharge: 'Aucune' | 'Hébergement pris en charge' | 'Totale' | 'Partielle';
  nbRepasPrisEnCharge: number;
  nbNuiteesPrisesEnCharge: number;
  
  // Calculated fields
  nbRepas: number;
  nbNuitees: number;
  montantRepas: number;
  montantNuitees: number;
  montantKilometrique: number;
  montantBrut: number;
  avance: number;
  montantNet: number;
  joursRecuperation: number;
  joursRestants: number;
  
  // Status
  creditee: boolean;
  dateCredit?: string; // YYYY-MM-DD
  observation?: string;
  baremeId: number;

  // Avenant N°1
  zoneUtilisee: 'Nord' | 'Sud';
  recalculLog?: { date: string; ancienJours: number; nouveauJours: number; raison: string }[];
  
  // Timestamps
  dateCreation: string;
  dateModification: string;
}

export interface Recuperation {
  idRecuperation: number;
  dateDebut: string; // YYYY-MM-DD
  nbJours: number;
  dateFin: string; // YYYY-MM-DD (calculated)
  commentaire?: string;
  dateCreation: string;
}

export interface RecuperationMission {
  id: number;
  idMission: number;
  idRecuperation: number;
  joursConsommes: number;
}

export interface Parametre {
  idParametre: number;
  pin?: string; // Minimum 4 digits
  pinActive: boolean;
  biometrieActive: boolean;
  theme: 'Clair' | 'Sombre' | 'Automatique';
  
  nomAgent?: string; // Added in Avenant N°1
  
  // Plages horaires pour les repas
  repasPlages: {
    dejeuner: { debut: string; fin: string }; // e.g. "12:00", "14:00"
    diner: { debut: string; fin: string };    // e.g. "19:00", "21:00"
    souper: { debut: string; fin: string };   // e.g. "00:00", "02:00"
  };
  // Plage horaire de la nuit
  nuitPlage: { debut: string; fin: string };  // e.g. "00:00", "05:00"
  accentColor?: 'blue' | 'emerald' | 'violet' | 'slate' | 'sunset' | 'teal';
  layout?: 'sidebar' | 'horizontal';
}

export interface AppDatabase {
  missions: Mission[];
  wilayas: Wilaya[];
  baremes: Bareme[];
  joursFeries: JourFerie[];
  recuperations: Recuperation[];
  recuperationMissions: RecuperationMission[];
  parametres: Parametre;
}
