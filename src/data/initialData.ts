/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wilaya, JourFerie, Bareme, Parametre } from '../types';

const SUD_WILAYAS_IDS = [1, 3, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];

export const INITIAL_WILAYAS: Wilaya[] = [
  { idWilaya: 1, code: 1, nom: 'Adrar', utilisateur: false, zone: 'Sud' },
  { idWilaya: 2, code: 2, nom: 'Chlef', utilisateur: false, zone: 'Nord' },
  { idWilaya: 3, code: 3, nom: 'Laghouat', utilisateur: false, zone: 'Sud' },
  { idWilaya: 4, code: 4, nom: 'Oum El Bouaghi', utilisateur: false, zone: 'Nord' },
  { idWilaya: 5, code: 5, nom: 'Batna', utilisateur: false, zone: 'Nord' },
  { idWilaya: 6, code: 6, nom: 'Béjaïa', utilisateur: false, zone: 'Nord' },
  { idWilaya: 7, code: 7, nom: 'Biskra', utilisateur: false, zone: 'Nord' },
  { idWilaya: 8, code: 8, nom: 'Béchar', utilisateur: false, zone: 'Sud' },
  { idWilaya: 9, code: 9, nom: 'Blida', utilisateur: false, zone: 'Nord' },
  { idWilaya: 10, code: 10, nom: 'Bouira', utilisateur: false, zone: 'Nord' },
  { idWilaya: 11, code: 11, nom: 'Tamanrasset', utilisateur: false, zone: 'Sud' },
  { idWilaya: 12, code: 12, nom: 'Tébessa', utilisateur: false, zone: 'Nord' },
  { idWilaya: 13, code: 13, nom: 'Tlemcen', utilisateur: false, zone: 'Nord' },
  { idWilaya: 14, code: 14, nom: 'Tiaret', utilisateur: false, zone: 'Nord' },
  { idWilaya: 15, code: 15, nom: 'Tizi Ouzou', utilisateur: false, zone: 'Nord' },
  { idWilaya: 16, code: 16, nom: 'Alger', utilisateur: false, zone: 'Nord' },
  { idWilaya: 17, code: 17, nom: 'Djelfa', utilisateur: false, zone: 'Nord' },
  { idWilaya: 18, code: 18, nom: 'Jijel', utilisateur: false, zone: 'Nord' },
  { idWilaya: 19, code: 19, nom: 'Sétif', utilisateur: false, zone: 'Nord' },
  { idWilaya: 20, code: 20, nom: 'Saïda', utilisateur: false, zone: 'Nord' },
  { idWilaya: 21, code: 21, nom: 'Skikda', utilisateur: false, zone: 'Nord' },
  { idWilaya: 22, code: 22, nom: 'Sidi Bel Abbès', utilisateur: false, zone: 'Nord' },
  { idWilaya: 23, code: 23, nom: 'Annaba', utilisateur: false, zone: 'Nord' },
  { idWilaya: 24, code: 24, nom: 'Guelma', utilisateur: false, zone: 'Nord' },
  { idWilaya: 25, code: 25, nom: 'Constantine', utilisateur: false, zone: 'Nord' },
  { idWilaya: 26, code: 26, nom: 'Médéa', utilisateur: false, zone: 'Nord' },
  { idWilaya: 27, code: 27, nom: 'Mostaganem', utilisateur: false, zone: 'Nord' },
  { idWilaya: 28, code: 28, nom: "M'Sila", utilisateur: false, zone: 'Nord' },
  { idWilaya: 29, code: 29, nom: 'Mascara', utilisateur: false, zone: 'Nord' },
  { idWilaya: 30, code: 30, nom: 'Ouargla', utilisateur: false, zone: 'Sud' },
  { idWilaya: 31, code: 31, nom: 'Oran', utilisateur: false, zone: 'Nord' },
  { idWilaya: 32, code: 32, nom: 'El Bayadh', utilisateur: false, zone: 'Nord' },
  { idWilaya: 33, code: 33, nom: 'Illizi', utilisateur: false, zone: 'Sud' },
  { idWilaya: 34, code: 34, nom: 'Bordj Bou Arréridj', utilisateur: false, zone: 'Nord' },
  { idWilaya: 35, code: 35, nom: 'Boumerdès', utilisateur: false, zone: 'Nord' },
  { idWilaya: 36, code: 36, nom: 'El Tarf', utilisateur: false, zone: 'Nord' },
  { idWilaya: 37, code: 37, nom: 'Tindouf', utilisateur: false, zone: 'Sud' },
  { idWilaya: 38, code: 38, nom: 'Tissemsilt', utilisateur: false, zone: 'Nord' },
  { idWilaya: 39, code: 39, nom: 'El Oued', utilisateur: false, zone: 'Sud' },
  { idWilaya: 40, code: 40, nom: 'Khenchela', utilisateur: false, zone: 'Nord' },
  { idWilaya: 41, code: 41, nom: 'Souk Ahras', utilisateur: false, zone: 'Nord' },
  { idWilaya: 42, code: 42, nom: 'Tipaza', utilisateur: false, zone: 'Nord' },
  { idWilaya: 43, code: 43, nom: 'Mila', utilisateur: false, zone: 'Nord' },
  { idWilaya: 44, code: 44, nom: 'Aïn Defla', utilisateur: false, zone: 'Nord' },
  { idWilaya: 45, code: 45, nom: 'Naâma', utilisateur: false, zone: 'Nord' },
  { idWilaya: 46, code: 46, nom: 'Aïn Témouchent', utilisateur: false, zone: 'Nord' },
  { idWilaya: 47, code: 47, nom: 'Ghardaïa', utilisateur: false, zone: 'Sud' },
  { idWilaya: 48, code: 48, nom: 'Relizane', utilisateur: false, zone: 'Nord' },
  { idWilaya: 49, code: 49, nom: "El M'Ghair", utilisateur: false, zone: 'Sud' },
  { idWilaya: 50, code: 50, nom: 'El Meniaa', utilisateur: false, zone: 'Sud' },
  { idWilaya: 51, code: 51, nom: 'Ouled Djellal', utilisateur: false, zone: 'Sud' },
  { idWilaya: 52, code: 52, nom: 'Bordj Baji Mokhtar', utilisateur: false, zone: 'Sud' },
  { idWilaya: 53, code: 53, nom: 'Béni Abbès', utilisateur: false, zone: 'Sud' },
  { idWilaya: 54, code: 54, nom: 'In Salah', utilisateur: false, zone: 'Sud' },
  { idWilaya: 55, code: 55, nom: 'In Guezzam', utilisateur: false, zone: 'Sud' },
  { idWilaya: 56, code: 56, nom: 'Touggourt', utilisateur: false, zone: 'Sud' },
  { idWilaya: 57, code: 57, nom: 'Djanet', utilisateur: false, zone: 'Sud' },
  { idWilaya: 58, code: 58, nom: 'El M\'Ghair', utilisateur: false, zone: 'Sud' }
];

export const INITIAL_JOURS_FERIES: JourFerie[] = [
  { idJourFerie: 1, date: '01-01', libelle: "Jour de l'An", type: 'Fixe' },
  { idJourFerie: 2, date: '05-01', libelle: "Fête du Travail", type: 'Fixe' },
  { idJourFerie: 3, date: '07-05', libelle: "Fête de l'Indépendance", type: 'Fixe' },
  { idJourFerie: 4, date: '11-01', libelle: "Anniversaire de la Révolution", type: 'Fixe' }
];

export const DEFAULT_BAREME: Bareme = {
  idBareme: 1,
  montantRepasNord: 1000, // 1000 DA (Execution & Maitrise reference)
  montantRepasSud: 1200, // 1200 DA
  montantNuiteeNord: 2000, // 2000 DA
  montantNuiteeSud: 2600, // 2600 DA
  forfaitJournalierNord: 4000, // 4000 DA
  forfaitJournalierSud: 5000, // 5000 DA
  indemniteKilometrique: 15, // 15 DA per km
  dateDebutValidite: '2026-01-01',
  actif: true
};

export const DEFAULT_PARAMETRES: Parametre = {
  idParametre: 1,
  pin: '',
  pinActive: false,
  biometrieActive: false,
  theme: 'Automatique',
  nomAgent: 'Bahloul Saif Eddine',
  repasPlages: {
    dejeuner: { debut: '12:00', fin: '14:00' },
    diner: { debut: '19:00', fin: '21:00' },
    souper: { debut: '00:00', fin: '02:00' }
  },
  nuitPlage: { debut: '00:00', fin: '05:00' },
  accentColor: 'blue'
};
