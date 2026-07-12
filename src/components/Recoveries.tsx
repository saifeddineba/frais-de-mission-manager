/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Trash2, Info, AlertTriangle, ArrowRight, UserCheck, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { Mission, Recuperation, RecuperationMission, Wilaya, JourFerie } from '../types';
import { MissionCalculator, getDayNameFrench } from '../utils/calculator';
import { suggestFIFOMissions } from '../utils/storage';

interface RecoveriesProps {
  missions: Mission[];
  recuperations: Recuperation[];
  recuperationMissions: RecuperationMission[];
  wilayas: Wilaya[];
  joursFeries: JourFerie[];
  onAddRecuperation: (
    recuperation: Omit<Recuperation, 'idRecuperation' | 'dateCreation'>,
    allocations: { idMission: number; joursConsommes: number }[]
  ) => { success: boolean; error?: string };
  onDeleteRecuperation: (id: number) => void;
  activeSectionTab?: string;
}

export default function Recoveries({
  missions,
  recuperations,
  recuperationMissions,
  wilayas,
  joursFeries,
  onAddRecuperation,
  onDeleteRecuperation,
  activeSectionTab
}: RecoveriesProps) {
  // Navigation tabs within Module 4
  const [activeTab, setActiveTab] = useState<'liste' | 'nouveau'>('liste');

  // New Recovery Form States
  const [dateDebut, setDateDebut] = useState('');
  const [nbJours, setNbJours] = useState<number>(1);
  const [commentaire, setCommentaire] = useState('');

  // Selected missions manual allocation override state
  // key: mission ID, value: days consumed in this pending recovery
  const [manualAllocations, setManualAllocations] = useState<{ [idMission: number]: number }>({});
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Detail view modal state
  const [selectedRecuperation, setSelectedRecuperation] = useState<Recuperation | null>(null);

  // Global totals
  const totalDaysAcquired = useMemo(() => missions.reduce((sum, m) => sum + m.joursRecuperation, 0), [missions]);
  const totalDaysConsumed = useMemo(() => recuperations.reduce((sum, r) => sum + r.nbJours, 0), [recuperations]);
  const availableDays = Math.max(0, totalDaysAcquired - totalDaysConsumed);

  // Trigger form tab if requested from outside
  useEffect(() => {
    if (activeSectionTab === 'nouveau') {
      setActiveTab('nouveau');
      const today = new Date().toISOString().split('T')[0];
      setDateDebut(today);
    }
  }, [activeSectionTab]);

  // Set default start date upon opening creation form
  useEffect(() => {
    if (activeTab === 'nouveau' && !dateDebut) {
      const today = new Date().toISOString().split('T')[0];
      setDateDebut(today);
    }
  }, [activeTab, dateDebut]);

  // Calculate simulated end date in real-time
  const computedEndData = useMemo(() => {
    if (!dateDebut || nbJours <= 0) return null;
    const { dateFin, joursConsommesDates } = MissionCalculator.calculateRecoveryDateFin(
      dateDebut,
      nbJours,
      joursFeries
    );
    const dayName = getDayNameFrench(dateFin);
    return { dateFin, dayName, datesList: joursConsommesDates };
  }, [dateDebut, nbJours, joursFeries]);

  // Get list of missions with available balance for allocation
  const missionsWithBalance = useMemo(() => {
    return missions
      .filter(m => m.joursRestants > 0)
      .sort((a, b) => a.dateDepart.localeCompare(b.dateDepart));
  }, [missions]);

  // Run automatic FIFO allocation suggestions
  useEffect(() => {
    if (nbJours <= 0 || missionsWithBalance.length === 0) {
      setManualAllocations({});
      return;
    }

    if (!isManualOverride) {
      // Create suggestion
      const suggested = suggestFIFOMissions(missions, nbJours);
      const allocMap: { [id: number]: number } = {};
      suggested.forEach(item => {
        allocMap[item.idMission] = item.joursConsommes;
      });
      setManualAllocations(allocMap);
    }
  }, [nbJours, missions, missionsWithBalance, isManualOverride]);

  // Total allocated sum in form
  const totalAllocatedSum = useMemo(() => {
    return (Object.values(manualAllocations) as number[]).reduce((sum, val) => sum + val, 0);
  }, [manualAllocations]);

  // Handle individual input changes in manual selection
  const handleManualAllocChange = (missionId: number, maxAvailable: number, valueStr: string) => {
    const val = Math.max(0, Math.min(maxAvailable, Number(valueStr) || 0));
    setManualAllocations(prev => ({
      ...prev,
      [missionId]: val
    }));
  };

  const handleResetToFIFO = () => {
    setIsManualOverride(false);
  };

  const getWilayaName = (id: number): string => {
    const w = wilayas.find(item => item.idWilaya === id);
    return w ? w.nom : 'Wilaya Inconnue';
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nbJours <= 0) return;
    if (nbJours > availableDays) {
      alert("Solde de récupération global insuffisant pour cette demande.");
      return;
    }

    // Double check allocation sum
    const totalAllocated = Object.values(calcActiveAllocations()).reduce((s, v) => s + v, 0);
    if (totalAllocated !== nbJours) {
      alert(`La répartition de récupération (${totalAllocated} j) ne correspond pas aux ${nbJours} jour(s) demandés.`);
      return;
    }

    const allocations = Object.entries(calcActiveAllocations())
      .filter(([_, val]) => val > 0)
      .map(([id, val]) => ({
        idMission: Number(id),
        joursConsommes: val
      }));

    if (!computedEndData) return;

    const newRecup = {
      dateDebut,
      nbJours,
      dateFin: computedEndData.dateFin,
      commentaire: commentaire || undefined
    };

    const result = onAddRecuperation(newRecup, allocations);
    if (result.success) {
      // Reset form
      setNbJours(1);
      setCommentaire('');
      setIsManualOverride(false);
      setManualAllocations({});
      setActiveTab('liste');
    } else {
      alert(result.error);
    }
  };

  // Filter allocation values to only keep available ones
  const calcActiveAllocations = (): { [id: number]: number } => {
    const result: { [id: number]: number } = {};
    missionsWithBalance.forEach(m => {
      if (manualAllocations[m.idMission]) {
        result[m.idMission] = manualAllocations[m.idMission];
      }
    });
    return result;
  };

  // Details sheet: list of missions associated with selected recovery
  const selectedRecuperationMissions = useMemo(() => {
    if (!selectedRecuperation) return [];
    
    // Find all links
    const links = recuperationMissions.filter(l => l.idRecuperation === selectedRecuperation.idRecuperation);
    return links.map(link => {
      const mission = missions.find(m => m.idMission === link.idMission);
      return {
        ...link,
        mission
      };
    });
  }, [selectedRecuperation, recuperationMissions, missions]);

  const handleDeleteRecuperation = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cet enregistrement de récupération ? Les jours consommés seront restitués aux missions correspondantes.')) {
      onDeleteRecuperation(id);
      setSelectedRecuperation(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-200/50 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('liste')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'liste'
              ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-recup-list"
        >
          Historique récupérations
        </button>
        <button
          onClick={() => {
            setActiveTab('nouveau');
            setIsManualOverride(false);
          }}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'nouveau'
              ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-2xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          id="tab-recup-new"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Déclarer une récupération</span>
        </button>
      </div>

      {activeTab === 'liste' ? (
        <div className="space-y-6">
          
          {/* Recovery balance card - Bento Grid design */}
          <div className="grid grid-cols-3 gap-4 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 p-6 shadow-2xs">
            <div className="text-center">
              <span className="text-[10px] text-slate-450 dark:text-slate-500 uppercase font-bold block mb-1 tracking-wider">Jours Acquis</span>
              <span className="text-3xl font-extrabold font-mono text-slate-700 dark:text-slate-200">{totalDaysAcquired}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Générés par missions</span>
            </div>
            
            <div className="text-center border-x border-slate-200/50 dark:border-slate-850">
              <span className="text-[10px] text-orange-550 dark:text-orange-400 uppercase font-bold block mb-1 tracking-wider">Consommés</span>
              <span className="text-3xl font-extrabold font-mono text-orange-600 dark:text-orange-400">{totalDaysConsumed}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Jours de congé pris</span>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-emerald-555 dark:text-emerald-400 uppercase font-bold block mb-1 tracking-wider">Solde Restant</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{availableDays}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Disponibles de suite</span>
            </div>
          </div>

          {/* List of past recoveries */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1.5">
              Historique des récupérations déclarées
            </h3>

            {recuperations.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 shadow-2xs">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-semibold">Aucune récupération enregistrée</p>
                <p className="text-slate-400 text-xs mt-1">Pour poser des congés de récupération, cliquez sur l'onglet ci-dessus.</p>
              </div>
            ) : (
              [...recuperations]
                .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))
                .map(r => {
                  const links = recuperationMissions.filter(link => link.idRecuperation === r.idRecuperation);
                  return (
                    <div
                      key={r.idRecuperation}
                      onClick={() => setSelectedRecuperation(r)}
                      className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-between cursor-pointer"
                      id={`recup-item-${r.idRecuperation}`}
                    >
                      <div className="space-y-1 pr-4">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block">
                          Du {new Date(r.dateDebut).toLocaleDateString('fr-FR')} au {new Date(r.dateFin).toLocaleDateString('fr-FR')}
                        </span>
                        <div className="flex gap-4 text-xs text-slate-400 font-medium">
                          <span>Finira un {getDayNameFrench(r.dateFin)}</span>
                          <span>•</span>
                          <span>Consomme {links.length} mission(s)</span>
                        </div>
                        {r.commentaire && (
                          <p className="text-xs text-slate-500 line-clamp-1 italic mt-1">
                            "{r.commentaire}"
                          </p>
                        )}
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <span className="text-base font-extrabold font-mono text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-xl border border-orange-100 dark:border-orange-900/30">
                          -{r.nbJours} j
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

        </div>
      ) : (
        /* Module 4 FORM: NEW RECOVERY */
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 p-6 shadow-2xs space-y-6">
          
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Déclarer un repos de récupération</h3>
            <p className="text-xs text-slate-500 mt-1">Le moteur calcule automatiquement la date de fin en sautant les week-ends (Vendredi/Samedi) et jours fériés</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Date de début du congé <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dateDebut}
                onChange={e => setDateDebut(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white dark:bg-slate-800"
                id="recup-input-date-debut"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Nombre de jours de repos demandés <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={availableDays}
                required
                value={nbJours}
                onChange={e => setNbJours(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                id="recup-input-nb-jours"
              />
              <p className="text-[10px] text-slate-400 mt-1">Solde global maximum disponible: {availableDays} jour(s)</p>
            </div>
          </div>

          {/* Real-time recovery date estimation */}
          {computedEndData && (
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 flex gap-3.5 text-xs text-amber-800 dark:text-amber-300">
              <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Décompte de congé (Géré par la classe indépendante) :</span>
                <p>
                  Fin de récupération calculée : <strong className="font-mono text-sm text-amber-700 dark:text-amber-400">{new Date(computedEndData.dateFin).toLocaleDateString('fr-FR')}</strong> (un <strong className="font-bold">{computedEndData.dayName}</strong>).
                </p>
                <div className="text-[10px] text-slate-400 mt-2">
                  Dates consommées ({computedEndData.datesList.length} j) : {computedEndData.datesList.map(d => new Date(d).toLocaleDateString('fr-FR')).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Commentaire / Justification (facultatif)
            </label>
            <input
              type="text"
              placeholder="Ex: Récupération pour heures sup. OM n°22..."
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
              id="recup-input-comment"
            />
          </div>

          {/* FIFO Association panel with manual override */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Affectation des jours par mission</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Associez ce congé aux missions ayant généré des jours.</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">Mode :</span>
                <button
                  type="button"
                  onClick={() => setIsManualOverride(prev => !prev)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    isManualOverride
                      ? 'bg-brand-light-bg text-brand-primary border-brand-primary/25'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                  }`}
                  id="btn-toggle-override"
                >
                  {isManualOverride ? 'Manuel (Personnalisé)' : 'Automatique (FIFO)'}
                </button>
                {isManualOverride && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualOverride(false);
                    }}
                    className="text-[10px] flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-full text-slate-500 hover:text-slate-800"
                    id="btn-reset-fifo"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Réinitialiser FIFO</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of missions to select and allocate */}
            <div className="space-y-2.5">
              {missionsWithBalance.length === 0 ? (
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 rounded-xl text-center text-xs text-rose-600 border border-rose-100 dark:border-rose-900/30">
                  <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                  <span>Aucune mission enregistrée ne dispose d'un solde de récupération positif ! Vous devez d'abord ajouter des missions.</span>
                </div>
              ) : (
                missionsWithBalance.map(m => {
                  const currentAlloc = manualAllocations[m.idMission] || 0;
                  
                  return (
                    <div
                      key={m.idMission}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all ${
                        currentAlloc > 0
                          ? 'bg-brand-light-bg/50 dark:bg-brand-primary/10 border-brand-primary/20 dark:border-brand-primary/35 shadow-2xs'
                          : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800'
                      }`}
                      id={`allocation-item-${m.idMission}`}
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">
                          {getWilayaName(m.wilayaId)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Du {new Date(m.dateDepart).toLocaleDateString('fr-FR')} • Solde dispo : <strong className="font-bold text-slate-500 dark:text-slate-400 font-mono">{m.joursRestants} / {m.joursRecuperation} j</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Prendre :</span>
                        
                        {isManualOverride ? (
                          <input
                            type="number"
                            min="0"
                            max={m.joursRestants}
                            value={currentAlloc}
                            onChange={e => handleManualAllocChange(m.idMission, m.joursRestants, e.target.value)}
                            className="w-16 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-1 text-xs focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-hidden"
                            id={`alloc-input-${m.idMission}`}
                          />
                        ) : (
                          <span className="w-12 text-center font-bold text-sm text-slate-600 dark:text-slate-300 font-mono">
                            {currentAlloc}
                          </span>
                        )}
                        <span className="text-slate-400 font-mono text-[10px]">jour(s)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total check line */}
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-xs font-semibold">
              <span className="text-slate-500">Total jours affectés :</span>
              <div className="flex items-center gap-1.5 font-bold font-mono">
                <span className={totalAllocatedSum === nbJours ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 animate-pulse'}>
                  {totalAllocatedSum}
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600 dark:text-slate-300">{nbJours} demandé(s)</span>
                {totalAllocatedSum === nbJours ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 ml-1" />
                )}
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('liste')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer"
              id="btn-cancel-recup-form"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={totalAllocatedSum !== nbJours || nbJours > availableDays}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                totalAllocatedSum !== nbJours || nbJours > availableDays
                  ? 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-slate-450'
                  : 'bg-brand-primary hover:bg-brand-primary-hover active:scale-98 cursor-pointer'
              }`}
              id="btn-confirm-recup"
            >
              Valider le congé
            </button>
          </div>

        </form>
      )}

      {/* DETAIL DIALOG OF A PAST RECOVERY (Fiche détaillée d'une récupération) */}
      {selectedRecuperation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10 flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Fiche de Récupération
                </h3>
                <p className="text-xs text-slate-500 mt-1">Déclarée le {new Date(selectedRecuperation.dateCreation).toLocaleDateString('fr-FR')} • ID : {selectedRecuperation.idRecuperation}</p>
              </div>
              <button
                onClick={() => setSelectedRecuperation(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                id="btn-close-recup-modal"
              >
                Fermer
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              
              {/* General Range Info */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Dates de congé de récupération</span>
                <span className="text-base font-bold text-slate-700 dark:text-slate-200 block">
                  Du {new Date(selectedRecuperation.dateDebut).toLocaleDateString('fr-FR')} au {new Date(selectedRecuperation.dateFin).toLocaleDateString('fr-FR')}
                </span>
                <div className="text-xs text-slate-500 font-medium">
                  Total de jours consommés : <strong className="text-orange-500 font-mono">{selectedRecuperation.nbJours} jour(s)</strong> (dernier jour : {getDayNameFrench(selectedRecuperation.dateFin)})
                </div>
              </div>

              {/* Comment */}
              {selectedRecuperation.commentaire && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Justification / Commentaire</span>
                  <p className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic">
                    "{selectedRecuperation.commentaire}"
                  </p>
                </div>
              )}

              {/* Missions details used */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Missions contribuant à ce repos (FIFO)</span>
                
                <div className="space-y-2">
                  {selectedRecuperationMissions.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-lg flex justify-between items-center text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.mission ? getWilayaName(item.mission.wilayaId) : `Mission n°${item.idMission}`}
                        </span>
                        {item.mission && (
                          <p className="text-[10px] text-slate-400">
                            Du {new Date(item.mission.dateDepart).toLocaleDateString('fr-FR')} au {new Date(item.mission.dateRetour).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-orange-500 font-mono">
                          -{item.joursConsommes} j
                        </span>
                        <p className="text-[9px] text-slate-400">sur son solde</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer and Delete Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteRecuperation(selectedRecuperation.idRecuperation)}
                className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all font-bold text-xs"
                id="btn-delete-recup"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer & Restituer jours</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRecuperation(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-300 transition-all"
                id="btn-close-recup-footer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
