/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertCircle, Edit, Trash2, CheckCircle2, XCircle, Info, Calendar, ArrowUpDown, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';
import { Mission, Wilaya, Bareme, Parametre } from '../types';

interface MissionHistoryProps {
  missions: Mission[];
  wilayas: Wilaya[];
  baremes: Bareme[];
  parametres: Parametre;
  onEditMission: (mission: Mission) => void;
  onDeleteMission: (id: number) => { success: boolean; error?: string };
  onUpdateCreditStatus: (id: number, creditee: boolean, dateCredit?: string) => void;
}

type FilterCredit = 'toutes' | 'creditees' | 'non_creditees';
type FilterRecup = 'toutes' | 'disponible' | 'consommee';

export default function MissionHistory({
  missions,
  wilayas,
  baremes,
  parametres,
  onEditMission,
  onDeleteMission,
  onUpdateCreditStatus
}: MissionHistoryProps) {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCredit, setFilterCredit] = useState<FilterCredit>('toutes');
  const [filterRecup, setFilterRecup] = useState<FilterRecup>('toutes');
  const [filterWilaya, setFilterWilaya] = useState<number | 'toutes'>('toutes');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Selected mission for full sheet details
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState<string | null>(null);
  const [editingCreditDate, setEditingCreditDate] = useState('');

  // Helper to fetch Wilaya Name from id
  const getWilayaName = (id: number) => {
    const w = wilayas.find(x => x.idWilaya === id);
    return w ? `${String(w.code).padStart(2, '0')} - ${w.nom}` : `Wilaya #${id}`;
  };

  // Helper to get Bareme info
  const getBaremeInfo = (id: number) => {
    return baremes.find(b => b.idBareme === id) || baremes[0];
  };

  // Filter & Search Logic
  const filteredMissions = useMemo(() => {
    return missions
      .filter(m => {
        // Search query check
        const wilStr = getWilayaName(m.wilayaId).toLowerCase();
        const obsStr = (m.observation || '').toLowerCase();
        const ordStr = (m.numeroOrdre || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        const matchesSearch = wilStr.includes(query) || obsStr.includes(query) || ordStr.includes(query);

        // Credit filter check
        let matchesCredit = true;
        if (filterCredit === 'creditees') matchesCredit = m.creditee;
        else if (filterCredit === 'non_creditees') matchesCredit = !m.creditee;

        // Recovery balance check
        let matchesRecup = true;
        if (filterRecup === 'disponible') matchesRecup = m.joursRestants > 0;
        else if (filterRecup === 'consommee') matchesRecup = m.joursRestants === 0 && m.joursRecuperation > 0;

        // Wilaya filter check
        let matchesWilaya = true;
        if (filterWilaya !== 'toutes') matchesWilaya = m.wilayaId === Number(filterWilaya);

        // Period filter check
        let matchesPeriod = true;
        if (dateDebut) {
          matchesPeriod = matchesPeriod && m.dateDepart >= dateDebut;
        }
        if (dateFin) {
          matchesPeriod = matchesPeriod && m.dateRetour <= dateFin;
        }

        return matchesSearch && matchesCredit && matchesRecup && matchesWilaya && matchesPeriod;
      })
      .sort((a, b) => {
        const dateA = `${a.dateDepart}T${a.heureDepart}`;
        const dateB = `${b.dateDepart}T${b.heureDepart}`;
        return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
      });
  }, [missions, searchQuery, filterCredit, filterRecup, filterWilaya, dateDebut, dateFin, sortOrder, wilayas]);

  // Statistics calculation on filtered set
  const stats = useMemo(() => {
    const total = filteredMissions.length;
    const creditees = filteredMissions.filter(m => m.creditee).length;
    const nonCreditees = total - creditees;
    const outstandingSum = filteredMissions.filter(m => !m.creditee).reduce((sum, m) => sum + m.montantNet, 0);

    return { total, creditees, nonCreditees, outstandingSum };
  }, [filteredMissions]);

  const handleDeleteClick = (mission: Mission, e: React.MouseEvent) => {
    e.stopPropagation();
    // Safety check: "La suppression est autorisée uniquement lorsque les jours de récupération n'ont pas été consommés"
    if (mission.joursRestants !== mission.joursRecuperation) {
      setShowDeleteAlert(`Impossible de supprimer cette mission car ${mission.joursRecuperation - mission.joursRestants} jour(s) de récupération acquis par cette mission ont déjà été consommés.`);
      return;
    }

    if (confirm('Voulez-vous vraiment supprimer cette mission définitivement ?')) {
      const result = onDeleteMission(mission.idMission);
      if (result.success) {
        if (selectedMission?.idMission === mission.idMission) {
          setSelectedMission(null);
        }
      } else {
        alert(result.error);
      }
    }
  };

  const handleUpdateCreditStatusInDetails = (mission: Mission, isChecked: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    onUpdateCreditStatus(mission.idMission, isChecked, isChecked ? todayStr : undefined);
    
    // Update the selected mission details on screen
    setSelectedMission(prev => {
      if (!prev) return null;
      return {
        ...prev,
        creditee: isChecked,
        dateCredit: isChecked ? todayStr : undefined
      };
    });
  };

  const handleCreditDateChange = (mission: Mission, dateStr: string) => {
    onUpdateCreditStatus(mission.idMission, mission.creditee, dateStr);
    setSelectedMission(prev => {
      if (!prev) return null;
      return {
        ...prev,
        dateCredit: dateStr
      };
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner stats - Bento Card Design */}
      <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/30 p-5 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
        <div className="text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-555 block tracking-wider">Total missions</span>
          <span className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-100">{stats.total}</span>
        </div>
        <div className="text-center border-x border-slate-200/50 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-emerald-500 block tracking-wider">Créditées</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{stats.creditees}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] uppercase font-bold text-rose-450 dark:text-rose-400 block tracking-wider">En Attente</span>
          <span className="text-2xl font-extrabold font-mono text-rose-555 dark:text-rose-400">{stats.nonCreditees}</span>
        </div>
      </div>

      {/* Advanced search and filter panels */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 shadow-2xs space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par wilaya, observation, numéro d'ordre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-hidden dark:text-white"
            id="search-mission-input"
          />
        </div>

        {/* Filters Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          {/* Credit Filter */}
          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">État du crédit</span>
            <div className="flex bg-slate-50 dark:bg-slate-900/50 p-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <button
                onClick={() => setFilterCredit('toutes')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${filterCredit === 'toutes' ? 'bg-white dark:bg-slate-800 shadow-2xs font-bold text-brand-primary' : 'text-slate-400'}`}
                id="filter-credit-all"
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterCredit('creditees')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${filterCredit === 'creditees' ? 'bg-white dark:bg-slate-800 shadow-2xs font-bold text-brand-primary' : 'text-slate-400'}`}
                id="filter-credit-paid"
              >
                Payées
              </button>
              <button
                onClick={() => setFilterCredit('non_creditees')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${filterCredit === 'non_creditees' ? 'bg-white dark:bg-slate-800 shadow-2xs font-bold text-brand-primary' : 'text-slate-400'}`}
                id="filter-credit-unpaid"
              >
                Attente
              </button>
            </div>
          </div>

          {/* Recovery Balance Filter */}
          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Jours de récupérations</span>
            <div className="flex bg-slate-50 dark:bg-slate-900/50 p-0.5 rounded-lg border border-slate-100 dark:border-slate-850">
              <button
                onClick={() => setFilterRecup('toutes')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${filterRecup === 'toutes' ? 'bg-white dark:bg-slate-800 shadow-2xs font-bold text-brand-primary' : 'text-slate-400'}`}
                id="filter-recup-all"
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterRecup('disponible')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${filterRecup === 'disponible' ? 'bg-white dark:bg-slate-800 shadow-2xs font-bold text-brand-primary' : 'text-slate-400'}`}
                id="filter-recup-available"
              >
                Dispo.
              </button>
              <button
                onClick={() => setFilterRecup('consommee')}
                className={`flex-1 py-1 rounded-md text-center transition-all ${filterRecup === 'consommee' ? 'bg-white dark:bg-slate-800 shadow-2xs font-bold text-brand-primary' : 'text-slate-400'}`}
                id="filter-recup-spent"
              >
                Consommées
              </button>
            </div>
          </div>

          {/* Wilaya Filter Selection */}
          <div>
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Filtrer par Wilaya</span>
            <select
              value={filterWilaya}
              onChange={e => setFilterWilaya(e.target.value === 'toutes' ? 'toutes' : Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-100 dark:border-slate-850 outline-hidden focus:ring-2 focus:ring-brand-primary/20 text-slate-600 dark:text-slate-300"
              id="filter-wilaya-select"
            >
              <option value="toutes">Toutes les wilayas</option>
              {wilayas.map(w => (
                <option key={w.idWilaya} value={w.idWilaya}>
                  {String(w.code).padStart(2, '0')} - {w.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date period filters & sort button */}
        <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-50 dark:border-slate-700/50 text-xs">
          <div className="flex-1 min-w-[120px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Du</span>
            <input
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              id="filter-date-debut"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Au</span>
            <input
              type="date"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              id="filter-date-fin"
            />
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg font-bold transition-all h-9"
            title="Inverser l'ordre de tri"
            id="btn-toggle-sort"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Tri: {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}</span>
          </button>
        </div>
      </div>

      {/* Warning message if delete blocked */}
      {showDeleteAlert && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-4 flex gap-3 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block mb-1">Action refusée (Règle métier 7.5)</span>
            <p>{showDeleteAlert}</p>
            <button
              onClick={() => setShowDeleteAlert(null)}
              className="underline text-[10px] font-bold block mt-2 cursor-pointer hover:text-rose-500"
            >
              Compris, fermer l'alerte
            </button>
          </div>
        </div>
      )}

      {/* Main List of missions */}
      <div className="space-y-3">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 shadow-2xs">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm font-semibold">Aucune mission ne correspond à vos filtres.</p>
            <p className="text-slate-400 text-xs mt-1">Créez une nouvelle mission ou élargissez vos critères de recherche.</p>
          </div>
        ) : (
          filteredMissions.map(m => {
            const daysLeftStr = `${m.joursRestants}/${m.joursRecuperation}`;
            const percentAvailable = m.joursRecuperation > 0 ? (m.joursRestants / m.joursRecuperation) * 100 : 0;
            
            return (
              <div
                key={m.idMission}
                onClick={() => {
                  setSelectedMission(m);
                  setEditingCreditDate(m.dateCredit || '');
                }}
                className="group bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200/60 dark:border-slate-700/50 p-5 shadow-2xs hover:shadow-xs dark:hover:border-slate-600 transition-all flex items-center justify-between cursor-pointer"
                id={`mission-item-${m.idMission}`}
              >
                {/* Details Left */}
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {getWilayaName(m.wilayaId)}
                    </span>
                    {m.numeroOrdre && (
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                        {m.numeroOrdre}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                      Du {new Date(m.dateDepart).toLocaleDateString('fr-FR')} au {new Date(m.dateRetour).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-[10px] bg-brand-light-bg/60 dark:bg-slate-900/40 px-2 py-0.5 rounded-full border border-brand-primary/10 dark:border-slate-800 text-brand-primary dark:text-brand-active-bg font-medium">
                      {m.typeTransport}
                    </span>
                  </div>
                </div>

                {/* Amount & Status Right */}
                <div className="flex items-center gap-4 text-right">
                  <div className="space-y-1">
                    <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100 block">
                      {m.montantNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
                    </span>
                    
                    <div className="flex items-center gap-2 justify-end">
                      {/* Recovery balance tag */}
                      {m.joursRecuperation > 0 && (
                        <span
                          className={`text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded-full border ${
                            m.joursRestants === 0
                              ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
                              : m.joursRestants === m.joursRecuperation
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                              : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                          }`}
                          title="Solde de jours de récupération restants"
                        >
                          Récup. {daysLeftStr} j
                        </span>
                      )}

                      {/* Paid Tag */}
                      {m.creditee ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Payée</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/10 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/20">
                          <XCircle className="w-3 h-3 text-amber-400" />
                          <span>Attente</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
          )}
        </div>

        {/* DETAILS BOTTOM SHEET DIALOG (Fiche détaillée d'une mission) */}
        {selectedMission && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-40 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Détail de la Mission
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Créée le {new Date(selectedMission.dateCreation).toLocaleDateString('fr-FR')} • Réf : {selectedMission.idMission}</p>
                </div>
                <button
                  onClick={() => setSelectedMission(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  id="btn-close-details"
                >
                  Fermer
                </button>
              </div>

              {/* Scrollable details body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                
                {/* 1. Administrative data */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Wilaya destination</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{getWilayaName(selectedMission.wilayaId)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">N° d'ordre de mission</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedMission.numeroOrdre || 'Non spécifié'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Départ</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {new Date(selectedMission.dateDepart).toLocaleDateString('fr-FR')} à {selectedMission.heureDepart}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Retour</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {new Date(selectedMission.dateRetour).toLocaleDateString('fr-FR')} à {selectedMission.heureRetour}
                    </span>
                  </div>
                </div>

                {/* 2. Calculation snapshot results */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    Décompte financier & Prise en charge
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="border border-slate-100 dark:border-slate-750 p-3 rounded-xl">
                      <span className="text-[10px] font-semibold text-slate-400 block">Repas indemnisés</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedMission.nbRepas} repas</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">({selectedMission.montantRepas.toFixed(2)} DA)</span>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-750 p-3 rounded-xl">
                      <span className="text-[10px] font-semibold text-slate-400 block">Nuitées indemnisées</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">{selectedMission.nbNuitees} nuitées</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">({selectedMission.montantNuitees.toFixed(2)} DA)</span>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-750 p-3 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-semibold text-slate-400 block">Frais de déplacement</span>
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">
                        {selectedMission.typeTransport === 'Véhicule personnel' ? `${selectedMission.kilometrage} km` : 'Tous moyens'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ({selectedMission.typeTransport === 'Véhicule personnel' ? selectedMission.montantKilometrique.toFixed(2) : selectedMission.montantTransport.toFixed(2)} DA)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl border border-blue-50 dark:border-blue-900/30 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Régime de prise en charge :</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{selectedMission.typePriseCharge}</span>
                    </div>
                    {selectedMission.typePriseCharge === 'Partielle' && (
                      <div className="text-[10px] text-slate-400 text-right">
                        Repas remboursés par l'hôte : {selectedMission.nbRepasPrisEnCharge} | Nuitées : {selectedMission.nbNuiteesPrisesEnCharge}
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/80 pt-1 mt-1 text-slate-500">
                      <span>Montant Brut :</span>
                      <span className="font-semibold">{selectedMission.montantBrut.toFixed(2)} DA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avance perçue :</span>
                      <span className="font-semibold text-rose-500">-{selectedMission.avance.toFixed(2)} DA</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-100 dark:border-blue-900/40 pt-1 mt-1 font-bold text-sm text-blue-700 dark:text-blue-400">
                      <span>Net à percevoir :</span>
                      <span className="font-mono text-base">{selectedMission.montantNet.toFixed(2)} DA</span>
                    </div>
                  </div>
                </div>

                {/* 3. Recovery Days breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-1">
                    Droits à récupération (Jours de repos)
                  </h4>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Acquis</span>
                      <span className="text-lg font-extrabold text-amber-500 font-mono">+{selectedMission.joursRecuperation}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Consommés</span>
                      <span className="text-lg font-extrabold text-slate-500 font-mono">
                        {selectedMission.joursRecuperation - selectedMission.joursRestants}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Restants</span>
                      <span className="text-lg font-extrabold text-emerald-500 font-mono">{selectedMission.joursRestants}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Payment Administration (Crédit) */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Administration du paiement (Crédit)
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMission.creditee}
                        onChange={e => handleUpdateCreditStatusInDetails(selectedMission, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
                        id="checkbox-details-credit"
                      />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Marquer comme créditée (remboursée)
                      </span>
                    </div>

                    {selectedMission.creditee && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Date crédit</span>
                        <input
                          type="date"
                          value={editingCreditDate}
                          onChange={e => {
                            setEditingCreditDate(e.target.value);
                            handleCreditDateChange(selectedMission, e.target.value);
                          }}
                          className="bg-white dark:bg-slate-800 text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
                          id="date-details-credit"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Observation */}
                {selectedMission.observation && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Observation</span>
                    <p className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic">
                      "{selectedMission.observation}"
                    </p>
                  </div>
                )}

                {/* 5b. Recalculation Audit Logs (Avenant N°1) */}
                {selectedMission.recalculLog && selectedMission.recalculLog.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Historique des recalculs rétroactifs (Avenant N°1)</span>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 space-y-2">
                      {selectedMission.recalculLog.map((log, idx) => (
                        <div key={idx} className="text-xs flex items-start gap-2.5 border-b border-amber-500/10 last:border-0 pb-2 last:pb-0">
                          <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg p-1 shrink-0 mt-0.5">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-350">
                              Solde de récupération ajusté : {log.ancienJours}j → <strong className="text-amber-600 dark:text-amber-400 font-bold">{log.nouveauJours}j</strong>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(log.date).toLocaleString('fr-FR')} • {log.raison}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Active Bareme Snapshot Reference */}
                <div className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/20 p-2.5 rounded-lg text-center border border-slate-100 dark:border-slate-800">
                  Calculé sur la version du barème #{selectedMission.baremeId} en vigueur au moment du calcul. <br/>
                  (Repas Nord/Sud: {getBaremeInfo(selectedMission.baremeId).montantRepasNord ?? (getBaremeInfo(selectedMission.baremeId) as any).montantRepas}/{getBaremeInfo(selectedMission.baremeId).montantRepasSud ?? (getBaremeInfo(selectedMission.baremeId) as any).montantRepas} DA, Nuitée Nord/Sud: {getBaremeInfo(selectedMission.baremeId).montantNuiteeNord ?? (getBaremeInfo(selectedMission.baremeId) as any).montantNuitee}/{getBaremeInfo(selectedMission.baremeId).montantNuiteeSud ?? (getBaremeInfo(selectedMission.baremeId) as any).montantNuitee} DA, IK: {getBaremeInfo(selectedMission.baremeId).indemniteKilometrique} DA/km)
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between gap-3">
                <button
                  onClick={(e) => {
                    handleDeleteClick(selectedMission, e);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all font-bold text-xs"
                  id="btn-delete-details"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer la mission</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onEditMission(selectedMission);
                      setSelectedMission(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-xs"
                    id="btn-edit-details"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier la mission</span>
                  </button>
                  <button
                    onClick={() => setSelectedMission(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-300 transition-all"
                    id="btn-close-details-footer"
                  >
                    Fermer
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
  );
}
