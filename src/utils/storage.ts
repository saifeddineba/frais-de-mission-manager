/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppDatabase, Mission, Recuperation, RecuperationMission, Wilaya, JourFerie, Bareme, Parametre } from '../types';
import { INITIAL_WILAYAS, INITIAL_JOURS_FERIES, DEFAULT_BAREME, DEFAULT_PARAMETRES } from '../data/initialData';

const LOCAL_STORAGE_KEY = 's_mission_manager_db';

/**
 * Migrates older databases to the current schema (Avenant N°1)
 */
export function migrateDatabase(parsed: any): AppDatabase {
  const migratedWilayas: Wilaya[] = (parsed.wilayas || INITIAL_WILAYAS).map((w: any) => {
    if (!w.zone) {
      const matching = INITIAL_WILAYAS.find(initW => initW.idWilaya === w.idWilaya || initW.nom.toLowerCase() === w.nom.toLowerCase());
      return { ...w, zone: matching ? matching.zone : 'Nord' };
    }
    return w;
  });

  const migratedBaremes: Bareme[] = (parsed.baremes || [DEFAULT_BAREME]).map((b: any) => {
    if (b.montantRepasNord === undefined) {
      return {
        ...b,
        montantRepasNord: b.montantRepas ?? 1000,
        montantRepasSud: b.montantRepas ?? 1200,
        montantNuiteeNord: b.montantNuitee ?? 2000,
        montantNuiteeSud: b.montantNuitee ?? 2600,
        forfaitJournalierNord: b.forfaitJournalier ?? 4000,
        forfaitJournalierSud: b.forfaitJournalier ?? 5000,
      };
    }
    return b;
  });

  const migratedMissions: Mission[] = (parsed.missions || []).map((m: any) => {
    if (!m.zoneUtilisee) {
      const w = migratedWilayas.find(wil => wil.idWilaya === m.wilayaId);
      return { ...m, zoneUtilisee: w ? w.zone : 'Nord' };
    }
    return m;
  });

  const defaultParams = { ...DEFAULT_PARAMETRES };
  const migratedParams: Parametre = {
    ...defaultParams,
    ...(parsed.parametres || {})
  };

  if (!migratedParams.nomAgent || migratedParams.nomAgent.trim() === '') {
    migratedParams.nomAgent = 'Bahloul Saif Eddine';
  }
  if (!migratedParams.accentColor) {
    migratedParams.accentColor = 'blue';
  }

  return {
    missions: migratedMissions,
    wilayas: migratedWilayas,
    baremes: migratedBaremes,
    joursFeries: parsed.joursFeries || INITIAL_JOURS_FERIES,
    recuperations: parsed.recuperations || [],
    recuperationMissions: parsed.recuperationMissions || [],
    parametres: migratedParams
  };
}

/**
 * Loads the complete database from localStorage or initializes it with default values
 */
export function loadDatabase(): AppDatabase {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return migrateDatabase(parsed);
    }
  } catch (error) {
    console.error('Failed to load database from localStorage', error);
  }

  // Fallback to initial default data
  const initialDb: AppDatabase = {
    missions: [],
    wilayas: INITIAL_WILAYAS,
    baremes: [DEFAULT_BAREME],
    joursFeries: INITIAL_JOURS_FERIES,
    recuperations: [],
    recuperationMissions: [],
    parametres: DEFAULT_PARAMETRES
  };
  saveDatabase(initialDb);
  return initialDb;
}

/**
 * Saves the complete database to localStorage
 */
export function saveDatabase(db: AppDatabase): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Failed to save database to localStorage', error);
  }
}

/**
 * Proposes a list of missions to consume days from using the FIFO method
 */
export function suggestFIFOMissions(
  missions: Mission[],
  requestedDays: number
): { idMission: number; joursConsommes: number }[] {
  // 1. Filter missions that have remaining recovery days
  // 2. Sort chronologically by dateDepart (oldest first)
  const availableMissions = missions
    .filter(m => m.joursRestants > 0)
    .sort((a, b) => a.dateDepart.localeCompare(b.dateDepart));
    
  let remainingDays = requestedDays;
  const result: { idMission: number; joursConsommes: number }[] = [];
  
  for (const m of availableMissions) {
    if (remainingDays <= 0) break;
    
    const toConsume = Math.min(m.joursRestants, remainingDays);
    result.push({
      idMission: m.idMission,
      joursConsommes: toConsume
    });
    remainingDays -= toConsume;
  }
  
  return result;
}

/**
 * Exports the whole database as a JSON string for download
 */
export function exportBackup(db: AppDatabase): string {
  return JSON.stringify(db, null, 2);
}

/**
 * Restores the database from a JSON string backup
 */
export function restoreBackup(backupStr: string): AppDatabase {
  const parsed = JSON.parse(backupStr);
  if (!parsed || (!Array.isArray(parsed.wilayas) && !parsed.parametres)) {
    throw new Error('Format de fichier de sauvegarde invalide');
  }
  
  const restoredDb = migrateDatabase(parsed);
  saveDatabase(restoredDb);
  return restoredDb;
}
