/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calculator, Save, AlertCircle, CalendarRange, MapPin, Truck, ShieldAlert, Coins } from 'lucide-react';
import { Mission, Wilaya, Bareme, Parametre } from '../types';
import { MissionCalculator } from '../utils/calculator';

interface NewMissionProps {
  wilayas: Wilaya[];
  activeBareme: Bareme;
  parametres: Parametre;
  joursFeries: any[];
  editingMission?: Mission | null;
  onSave: (mission: Omit<Mission, 'dateCreation' | 'dateModification'> | Mission) => void;
  onCancel: () => void;
}

export default function NewMission({
  wilayas,
  activeBareme,
  parametres,
  joursFeries,
  editingMission,
  onSave,
  onCancel
}: NewMissionProps) {
  // Form State
  const [numeroOrdre, setNumeroOrdre] = useState('');
  const [wilayaId, setWilayaId] = useState<number>(1);
  const [dateDepart, setDateDepart] = useState('');
  const [heureDepart, setHeureDepart] = useState('08:00');
  const [dateRetour, setDateRetour] = useState('');
  const [heureRetour, setHeureRetour] = useState('17:00');
  const [typeTransport, setTypeTransport] = useState<'Véhicule personnel' | 'Tous moyens'>('Véhicule personnel');
  const [kilometrage, setKilometrage] = useState<number>(0);
  const [montantTransport, setMontantTransport] = useState<number>(0);
  const [typePriseCharge, setTypePriseCharge] = useState<'Aucune' | 'Hébergement pris en charge' | 'Totale' | 'Partielle'>('Aucune');
  const [nbRepasPrisEnCharge, setNbRepasPrisEnCharge] = useState<number>(0);
  const [nbNuiteesPrisesEnCharge, setNbNuiteesPrisesEnCharge] = useState<number>(0);
  const [avance, setAvance] = useState<number>(0);
  const [observation, setObservation] = useState('');
  const [creditee, setCreditee] = useState(false);
  const [dateCredit, setDateCredit] = useState('');

  // Error validation State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculation Results
  const [calcResults, setCalcResults] = useState<any>(null);

  // Prefill if editing
  useEffect(() => {
    if (editingMission) {
      setNumeroOrdre(editingMission.numeroOrdre || '');
      setWilayaId(editingMission.wilayaId);
      setDateDepart(editingMission.dateDepart);
      setHeureDepart(editingMission.heureDepart);
      setDateRetour(editingMission.dateRetour);
      setHeureRetour(editingMission.heureRetour);
      setTypeTransport(editingMission.typeTransport);
      setKilometrage(editingMission.kilometrage);
      setMontantTransport(editingMission.montantTransport);
      setTypePriseCharge(editingMission.typePriseCharge);
      setNbRepasPrisEnCharge(editingMission.nbRepasPrisEnCharge);
      setNbNuiteesPrisesEnCharge(editingMission.nbNuiteesPrisesEnCharge);
      setAvance(editingMission.avance);
      setObservation(editingMission.observation || '');
      setCreditee(editingMission.creditee);
      setDateCredit(editingMission.dateCredit || '');
    } else {
      // Default dates to today
      const today = new Date().toISOString().split('T')[0];
      setDateDepart(today);
      setDateRetour(today);
    }
  }, [editingMission]);

  // Run dynamic calculation on state change
  useEffect(() => {
    const errors: string[] = [];
    
    if (!dateDepart || !dateRetour) {
      setCalcResults(null);
      return;
    }

    // Date coherency checks
    const start = new Date(dateDepart + 'T' + heureDepart);
    const end = new Date(dateRetour + 'T' + heureRetour);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.push('Dates ou heures invalides');
    } else if (end < start) {
      errors.push('La date et heure de retour doivent être postérieures au départ.');
    }

    // Number validation checks
    if (kilometrage < 0) {
      errors.push('Le kilométrage ne peut pas être négatif');
    }
    if (montantTransport < 0) {
      errors.push('Le montant du transport ne peut pas être négatif');
    }
    if (nbRepasPrisEnCharge < 0) {
      errors.push('Le nombre de repas pris en charge ne peut pas être négatif');
    }
    if (nbNuiteesPrisesEnCharge < 0) {
      errors.push('Le nombre de nuitées prises en charge ne peut pas être négatif');
    }
    if (avance < 0) {
      errors.push("Le montant de l'avance ne peut pas être négatif");
    }

    setValidationErrors(errors);

    if (errors.length === 0) {
      try {
        const selectedWilaya = wilayas.find(w => w.idWilaya === wilayaId);
        const zoneUtilisee = selectedWilaya ? selectedWilaya.zone : (editingMission?.zoneUtilisee || 'Nord');

        const input = {
          numeroOrdre: numeroOrdre || undefined,
          wilayaId,
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
          observation: observation || undefined,
          creditee,
          dateCredit: dateCredit || undefined,
          baremeId: editingMission?.baremeId || activeBareme.idBareme,
          zoneUtilisee
        };
        
        // Call the calculator
        const results = MissionCalculator.calculate(
          input,
          activeBareme,
          joursFeries,
          parametres
        );
        setCalcResults(results);
      } catch (err) {
        console.error('Calculation error', err);
        setCalcResults(null);
      }
    } else {
      setCalcResults(null);
    }
  }, [
    numeroOrdre, wilayaId, dateDepart, heureDepart, dateRetour, heureRetour,
    typeTransport, kilometrage, montantTransport, typePriseCharge,
    nbRepasPrisEnCharge, nbNuiteesPrisesEnCharge, avance, observation, creditee, dateCredit,
    activeBareme, joursFeries, parametres, editingMission, wilayas
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationErrors.length > 0 || !calcResults) return;

    const missionData: Omit<Mission, 'dateCreation' | 'dateModification'> & { dateCreation?: string; dateModification?: string } = {
      idMission: editingMission ? editingMission.idMission : Date.now(),
      numeroOrdre: numeroOrdre || undefined,
      wilayaId,
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
      observation: observation || undefined,
      creditee,
      dateCredit: creditee ? (dateCredit || new Date().toISOString().split('T')[0]) : undefined,
      baremeId: editingMission ? editingMission.baremeId : activeBareme.idBareme,
      ...calcResults
    };

    if (editingMission) {
      missionData.dateCreation = editingMission.dateCreation;
      missionData.dateModification = new Date().toISOString();
    }

    onSave(missionData as Mission);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-xs overflow-hidden">
      {/* Form Header */}
      <div className="border-b border-slate-100 dark:border-slate-700/60 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {editingMission ? 'Modifier la mission' : 'Nouvelle mission professionnelle'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Renseignez tous les détails de votre déplacement</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-600 dark:text-slate-300"
          id="btn-cancel-mission"
        >
          Annuler
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Validation Error Alerts */}
        {validationErrors.length > 0 && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-xl p-4 text-rose-700 dark:text-rose-300 text-sm space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Veuillez corriger les erreurs de saisie :</span>
            </div>
            <ul className="list-disc pl-6 text-xs space-y-1 mt-1">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Informations administratives */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informations administratives</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Numéro d'ordre de mission (facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex: OM-2026-45"
                value={numeroOrdre}
                onChange={e => setNumeroOrdre(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-hidden dark:text-white"
                id="input-numero-ordre"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Wilaya de destination <span className="text-rose-500">*</span>
              </label>
              <select
                value={wilayaId}
                onChange={e => setWilayaId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="input-wilaya"
              >
                {wilayas.map(w => (
                  <option key={w.idWilaya} value={w.idWilaya}>
                    {String(w.code).padStart(2, '0')} - {w.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Dates et heures */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
            <CalendarRange className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dates et heures</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Date de départ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateDepart}
                onChange={e => setDateDepart(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="input-date-depart"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Heure de départ <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={heureDepart}
                onChange={e => setHeureDepart(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="input-heure-depart"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Date de retour <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateRetour}
                onChange={e => setDateRetour(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="input-date-retour"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Heure de retour <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={heureRetour}
                onChange={e => setHeureRetour(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="input-heure-retour"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Déplacement */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
            <Truck className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Déplacement & Transport</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Mode de transport <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTypeTransport('Véhicule personnel')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    typeTransport === 'Véhicule personnel'
                      ? 'bg-brand-light-bg text-brand-primary border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-active-bg dark:border-brand-primary/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 dark:text-slate-300'
                  }`}
                  id="btn-transport-vehicule"
                >
                  Véhicule personnel
                </button>
                <button
                  type="button"
                  onClick={() => setTypeTransport('Tous moyens')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    typeTransport === 'Tous moyens'
                      ? 'bg-brand-light-bg text-brand-primary border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-active-bg dark:border-brand-primary/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 dark:text-slate-300'
                  }`}
                  id="btn-transport-tous-moyens"
                >
                  Tous moyens
                </button>
              </div>
            </div>

            {typeTransport === 'Véhicule personnel' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Kilométrage parcouru (km) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={kilometrage}
                  onChange={e => setKilometrage(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                  id="input-kilometrage"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Calculé avec le barème : {activeBareme.indemniteKilometrique} DA/km
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Montant des frais de transport (DA) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={montantTransport}
                  onChange={e => setMontantTransport(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                  id="input-montant-transport"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Prise en charge */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
            <Coins className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prise en charge</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Type de prise en charge <span className="text-rose-500">*</span>
              </label>
              <select
                value={typePriseCharge}
                onChange={e => setTypePriseCharge(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="input-type-prise-charge"
              >
                <option value="Aucune">Aucune prise en charge (100% remboursé)</option>
                <option value="Hébergement pris en charge">Hébergement pris en charge (Nuitée 25%, Repas 100%)</option>
                <option value="Totale">Prise en charge totale (Forfait 25%)</option>
                <option value="Partielle">Prise en charge partielle (Spécifier repas/nuitées)</option>
              </select>
            </div>

            {typePriseCharge === 'Partielle' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Repas pris en charge
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nbRepasPrisEnCharge}
                    onChange={e => setNbRepasPrisEnCharge(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1 text-xs focus:border-brand-primary focus:outline-hidden dark:text-white"
                    id="input-nb-repas-pris-charge"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Ces repas seront à 25%</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Nuitées prises en charge
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nbNuiteesPrisesEnCharge}
                    onChange={e => setNbNuiteesPrisesEnCharge(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1 text-xs focus:border-brand-primary focus:outline-hidden dark:text-white"
                    id="input-nb-nuitees-prises-charge"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Ces nuitées seront à 25%</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Avance et Observation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
            <Coins className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informations financières & Observations</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Avance perçue (DA)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={avance}
                onChange={e => setAvance(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                id="input-avance"
              />
              <p className="text-[10px] text-slate-400 mt-1">L'avance sera déduite du montant net</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Observation
              </label>
              <textarea
                placeholder="Ex: Réunion de coordination régionale..."
                value={observation}
                onChange={e => setObservation(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                id="input-observation"
              />
            </div>
          </div>

          {/* Credit section (Optional, only for edit or detailed check) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Cette mission est-elle déjà créditée (payée) ?</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Cochez si vous avez déjà reçu le virement.</p>
              </div>
              <input
                type="checkbox"
                checked={creditee}
                onChange={e => setCreditee(e.target.checked)}
                className="w-5 h-5 rounded-md border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                id="input-creditee"
              />
            </div>
            {creditee && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Date de crédit
                </label>
                <input
                  type="date"
                  value={dateCredit}
                  onChange={e => setDateCredit(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                  id="input-date-credit"
                />
              </div>
            )}
          </div>
        </div>

        {/* RESULTS SECTION (Résultat du calcul) */}
        {calcResults && (
          <div className="bg-brand-light-bg/50 dark:bg-slate-900/40 border border-brand-primary/10 dark:border-slate-800/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-brand-primary dark:text-brand-active-bg font-extrabold text-sm">
              <Calculator className="w-5 h-5" />
              <span>Décompte réglementaire en temps réel (Avenant N°1)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Repas indemnisables</span>
                <span className="text-lg font-extrabold font-mono text-slate-700 dark:text-slate-200">{calcResults.nbRepas}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({calcResults.montantRepas.toFixed(2)} DA)</span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Nuitées indemnisables</span>
                <span className="text-lg font-extrabold font-mono text-slate-700 dark:text-slate-200">{calcResults.nbNuitees}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({calcResults.montantNuitees.toFixed(2)} DA)</span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Déplacement & Transport</span>
                <span className="text-lg font-extrabold font-mono text-slate-700 dark:text-slate-200">
                  {typeTransport === 'Véhicule personnel' ? calcResults.montantKilometrique.toFixed(2) : montantTransport.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">DA</span>
              </div>

              <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Récupération acquise</span>
                <span className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  +{calcResults.joursRecuperation}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">jours de repos</span>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-brand-primary/10 dark:border-slate-800/60">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Montant Brut : {calcResults.montantBrut.toFixed(2)} DA</span>
                <span className="text-xs text-slate-500 block font-medium">Déduction Avance : -{avance.toFixed(2)} DA</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">Net à percevoir</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {calcResults.montantNet.toFixed(2)} DA
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-750">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
            id="btn-cancel-form"
          >
            Annuler
          </button>
          
          <button
            type="submit"
            disabled={validationErrors.length > 0 || !calcResults}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
              validationErrors.length > 0 || !calcResults
                ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-slate-450'
                : 'bg-brand-primary hover:bg-brand-primary-hover active:scale-98 cursor-pointer'
            }`}
            id="btn-save-mission"
          >
            <Save className="w-4 h-4" />
            <span>{editingMission ? 'Enregistrer les modifications' : 'Enregistrer la mission'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
