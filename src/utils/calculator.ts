/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mission, Bareme, JourFerie, Parametre } from '../types';

/**
 * Converts a "HH:mm" time string into minutes from midnight (0 to 1440)
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Checks if a given date string is a registered holiday (fixed or mobile)
 */
export function isJourFerie(dateStr: string, joursFeries: JourFerie[]): boolean {
  // dateStr format: YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const mmDd = `${parts[1]}-${parts[2]}`; // MM-DD
  
  return joursFeries.some(jf => {
    if (jf.type === 'Fixe') {
      return jf.date === mmDd;
    } else {
      return jf.date === dateStr;
    }
  });
}

/**
 * Checks if a given Date is Friday or Saturday (the Algerian weekend)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0: Sunday, ..., 5: Friday, 6: Saturday
  return day === 5 || day === 6;
}

/**
 * Returns the name of the day in French
 */
export function getDayNameFrench(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[date.getDay()];
}

/**
 * Helper to generate all dates between startDate and endDate (inclusive)
 */
export function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  
  const current = new Date(start);
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Calcule le nombre total de repas d'une mission.
 *
 * Règles :
 * - Petit-déjeuner jamais indemnisé.
 * - Mission d'une journée :
 *      Départ < 12h
 *          Retour < 21h  => 1 repas
 *          Retour >=21h  => 2 repas
 *
 *      Départ >=12h
 *          Retour <21h   => 0 repas
 *          Retour >=21h  => 1 repas
 *
 * - Mission sur plusieurs jours :
 *      Premier jour
 *          Départ <12h   => 2 repas
 *          Départ >=12h  => 1 repas
 *
 *      Chaque jour intermédiaire => 2 repas
 *
 *      Dernier jour
 *          Retour <14h    => 0 repas
 *          Retour >=14h   => 1 repas
 *          Retour >=21h   => 2 repas
 */
export function calculateMeals(
  departure: Date,
  returnDate: Date
): number {
  const depHour = departure.getHours() + departure.getMinutes() / 60;
  const retHour = returnDate.getHours() + returnDate.getMinutes() / 60;

  // Nombre de jours calendaires
  const dep = new Date(
    departure.getFullYear(),
    departure.getMonth(),
    departure.getDate()
  );

  const ret = new Date(
    returnDate.getFullYear(),
    returnDate.getMonth(),
    returnDate.getDate()
  );

  const days = Math.round((ret.getTime() - dep.getTime()) / 86400000);

  //------------------------------------------------------
  // Mission sur une seule journée
  //------------------------------------------------------
  if (days === 0) {
    if (depHour < 12) {
      if (retHour >= 21) return 2;
      return 1;
    }

    // départ >= 12h
    if (retHour >= 21) return 1;
    return 0;
  }

  //------------------------------------------------------
  // Mission sur plusieurs jours
  //------------------------------------------------------
  let meals = 0;

  // Premier jour
  if (depHour < 12) meals += 2;
  else meals += 1;

  // Jours intermédiaires
  if (days > 1) {
    meals += (days - 1) * 2;
  }

  // Dernier jour
  if (retHour >= 21) meals += 2;
  else if (retHour >= 14) meals += 1;

  return meals;
}

/**
 * The core calculation class for S-Mission Manager
 */
export class MissionCalculator {
  
  /**
   * Computes meals, night stays, mileage/transport, brut, net, and recovery days for a mission
   */
  static calculate(
    missionInput: Omit<Mission, 'idMission' | 'nbRepas' | 'nbNuitees' | 'montantRepas' | 'montantNuitees' | 'montantKilometrique' | 'montantBrut' | 'montantNet' | 'joursRecuperation' | 'joursRestants' | 'dateCreation' | 'dateModification' | 'zoneUtilisee'> & { zoneUtilisee: 'Nord' | 'Sud' },
    bareme: Bareme,
    joursFeries: JourFerie[],
    parametres: Parametre
  ): Pick<Mission, 'nbRepas' | 'nbNuitees' | 'montantRepas' | 'montantNuitees' | 'montantKilometrique' | 'montantBrut' | 'montantNet' | 'joursRecuperation' | 'joursRestants' | 'zoneUtilisee'> {
    
    const {
      dateDepart,
      heureDepart,
      dateRetour,
      heureRetour,
      typeTransport,
      kilometrage,
      montantTransport,
      typePriseCharge,
      nbRepasPrisEnCharge,
      nbNuiteesPrisesEnCharge,
      avance,
      zoneUtilisee
    } = missionInput;

    const dates = getDatesInRange(dateDepart, dateRetour);
    
    // Parse times into minutes
    const depMin = timeToMinutes(heureDepart);
    const retMin = timeToMinutes(heureRetour);
    
    // Plages horaires in minutes
    const dejeunerStart = timeToMinutes(parametres.repasPlages.dejeuner.debut);
    const dejeunerEnd = timeToMinutes(parametres.repasPlages.dejeuner.fin);
    
    const dinerStart = timeToMinutes(parametres.repasPlages.diner.debut);
    const dinerEnd = timeToMinutes(parametres.repasPlages.diner.fin);
    
    const souperStart = timeToMinutes(parametres.repasPlages.souper.debut);
    const souperEnd = timeToMinutes(parametres.repasPlages.souper.fin);
    
    const nuitStart = timeToMinutes(parametres.nuitPlage.debut);
    const nuitEnd = timeToMinutes(parametres.nuitPlage.fin);

    const depDateObj = new Date(`${dateDepart}T${heureDepart}:00`);
    const retDateObj = new Date(`${dateRetour}T${heureRetour}:00`);
    const calculatedRepas = calculateMeals(depDateObj, retDateObj);

    let calculatedNuitees = 0;
    let joursRecuperation = 0;

    // Loop through each calendar day of the mission to compute nights and recovery days
    dates.forEach((dateStr, index) => {
      const isFirstDay = index === 0;
      const isLastDay = index === dates.length - 1;
      
      // Calculate active span of mission on this particular day
      let dayStart = 0;
      let dayEnd = 1440; // 24 hours * 60 minutes
      
      if (isFirstDay && isLastDay) {
        dayStart = depMin;
        dayEnd = retMin;
      } else if (isFirstDay) {
        dayStart = depMin;
        dayEnd = 1440;
      } else if (isLastDay) {
        dayStart = 0;
        dayEnd = retMin;
      }

      // Check nights (fully covers the night plage)
      if (dayStart <= nuitStart && dayEnd >= nuitEnd) {
        calculatedNuitees++;
      }

      // Calculate Recovery Days (jours de récupération)
      // Check if day is holiday
      const isHoliday = isJourFerie(dateStr, joursFeries);
      const tempDate = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = tempDate.getDay(); // 0 Sunday, ..., 5 Friday, 6 Saturday
      
      if (isHoliday) {
        joursRecuperation += 2; // holiday is always 2 days, overrides Friday/Saturday
      } else if (dayOfWeek === 5) {
        joursRecuperation += 2; // Friday = 2 days
      } else if (dayOfWeek === 6) {
        joursRecuperation += 1; // Saturday = 1 day
      }
    });

    // Determine the amounts based on geographic zone of the wilaya
    const isSud = zoneUtilisee === 'Sud';
    const activeMontantRepas = isSud ? bareme.montantRepasSud : bareme.montantRepasNord;
    const activeMontantNuitee = isSud ? bareme.montantNuiteeSud : bareme.montantNuiteeNord;
    
    // Always equal to (repas * 2) + nuitee as per Requirement 2
    const activeForfaitJournalier = isSud 
      ? (bareme.montantRepasSud * 2) + bareme.montantNuiteeSud 
      : (bareme.montantRepasNord * 2) + bareme.montantNuiteeNord;

    // Calculate transport cost
    let montantKilometrique = 0;
    let finalFraisTransport = 0;

    if (typeTransport === 'Véhicule personnel') {
      montantKilometrique = kilometrage * bareme.indemniteKilometrique;
    } else {
      finalFraisTransport = montantTransport;
    }

    // Apply Prise en charge (Coverage by host) rules
    let montantRepas = 0;
    let montantNuitees = 0;
    let montantBrut = 0;

    if (typePriseCharge === 'Aucune') {
      montantRepas = calculatedRepas * activeMontantRepas;
      montantNuitees = calculatedNuitees * activeMontantNuitee;
      montantBrut = montantRepas + montantNuitees + (typeTransport === 'Véhicule personnel' ? montantKilometrique : finalFraisTransport);
    } 
    else if (typePriseCharge === 'Hébergement pris en charge') {
      montantRepas = calculatedRepas * activeMontantRepas;
      montantNuitees = calculatedNuitees * activeMontantNuitee * 0.25; // 25% for covered nights
      montantBrut = montantRepas + montantNuitees + (typeTransport === 'Véhicule personnel' ? montantKilometrique : finalFraisTransport);
    } 
    else if (typePriseCharge === 'Totale') {
      // Nombre de jours de la mission
      const nbJoursMission = dates.length;
      // Formula: Nombre de jours × Forfait journalier × 25%
      const indemnitesPriseEnChargeTotale = nbJoursMission * activeForfaitJournalier * 0.25;
      montantBrut = indemnitesPriseEnChargeTotale + (typeTransport === 'Véhicule personnel' ? montantKilometrique : finalFraisTransport);
    } 
    else if (typePriseCharge === 'Partielle') {
      // Repas: nbRepasPrisEnCharge at 25%, others at 100%
      const activeRepasPrisEnCharge = Math.min(nbRepasPrisEnCharge, calculatedRepas);
      const activeRepasNonPrisEnCharge = Math.max(0, calculatedRepas - activeRepasPrisEnCharge);
      
      montantRepas = (activeRepasPrisEnCharge * activeMontantRepas * 0.25) + 
                     (activeRepasNonPrisEnCharge * activeMontantRepas);
                     
      // Nuitées: nbNuiteesPrisesEnCharge at 25%, others at 100%
      const activeNuiteesPrisesEnCharge = Math.min(nbNuiteesPrisesEnCharge, calculatedNuitees);
      const activeNuiteesNonPrisEnCharge = Math.max(0, calculatedNuitees - activeNuiteesPrisesEnCharge);
      
      montantNuitees = (activeNuiteesPrisesEnCharge * activeMontantNuitee * 0.25) + 
                       (activeNuiteesNonPrisEnCharge * activeMontantNuitee);
                       
      montantBrut = montantRepas + montantNuitees + (typeTransport === 'Véhicule personnel' ? montantKilometrique : finalFraisTransport);
    }

    // Net amount = Brut - Avance
    const montantNet = Math.max(0, montantBrut - avance);

    return {
      nbRepas: calculatedRepas,
      nbNuitees: calculatedNuitees,
      montantRepas,
      montantNuitees,
      montantKilometrique,
      montantBrut,
      montantNet,
      joursRecuperation,
      joursRestants: joursRecuperation, // initial available recovery days is the total acquired
      zoneUtilisee
    };
  }

  /**
   * Calculates the end date of a recovery period.
   * Excludes weekends (Friday & Saturday) and public holidays.
   */
  static calculateRecoveryDateFin(
    dateDebut: string,
    nbJours: number,
    joursFeries: JourFerie[]
  ): { dateFin: string; joursConsommesDates: string[] } {
    let daysAdded = 0;
    let currentDate = new Date(dateDebut + 'T00:00:00');
    const joursConsommesDates: string[] = [];
    
    // Safety check
    if (nbJours <= 0) {
      return { dateFin: dateDebut, joursConsommesDates: [] };
    }

    let iterations = 0;
    while (daysAdded < nbJours && iterations < 1000) {
      iterations++;
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const isWE = isWeekend(currentDate);
      const isHoliday = isJourFerie(dateStr, joursFeries);
      
      if (!isWE && !isHoliday) {
        joursConsommesDates.push(dateStr);
        daysAdded++;
      }
      
      if (daysAdded < nbJours) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const dateFin = `${yyyy}-${mm}-${dd}`;
    
    return { dateFin, joursConsommesDates };
  }

  /**
   * Recalculates all missions in bulk when global configuration (holidays, bareme, or active hours) changes.
   */
  static recalculateMissions(
    missions: Mission[],
    baremes: Bareme[],
    joursFeries: JourFerie[],
    parametres: Parametre
  ): Mission[] {
    const activeBareme = baremes.find(b => b.actif) || baremes[baremes.length - 1];
    if (!activeBareme) return missions;

    return missions.map(m => {
      const baremeForMission = baremes.find(b => b.idBareme === m.baremeId) || activeBareme;
      const calcResult = MissionCalculator.calculate(
        {
          wilayaId: m.wilayaId,
          creditee: m.creditee,
          baremeId: m.baremeId,
          dateDepart: m.dateDepart,
          heureDepart: m.heureDepart,
          dateRetour: m.dateRetour,
          heureRetour: m.heureRetour,
          typeTransport: m.typeTransport,
          kilometrage: m.kilometrage,
          montantTransport: m.montantTransport,
          typePriseCharge: m.typePriseCharge,
          nbRepasPrisEnCharge: m.nbRepasPrisEnCharge,
          nbNuiteesPrisesEnCharge: m.nbNuiteesPrisesEnCharge,
          avance: m.avance,
          zoneUtilisee: m.zoneUtilisee || 'Nord'
        },
        baremeForMission,
        joursFeries,
        parametres
      );

      const oldJours = m.joursRecuperation;
      const newJours = calcResult.joursRecuperation;

      if (oldJours !== newJours) {
        const daysConsumed = oldJours - m.joursRestants;
        const newRestants = Math.max(0, newJours - daysConsumed);

        const logEntry = {
          date: new Date().toISOString(),
          ancienJours: oldJours,
          nouveauJours: newJours,
          raison: "Recalcul rétroactif (Avenant N°1) suite à la mise à jour des jours fériés ou barèmes."
        };

        return {
          ...m,
          ...calcResult,
          joursRestants: newRestants,
          recalculLog: [...(m.recalculLog || []), logEntry],
          dateModification: new Date().toISOString()
        };
      }

      // If amounts or meal counts changed, also update them!
      return {
        ...m,
        ...calcResult,
        joursRestants: m.joursRestants,
      };
    });
  }
}
