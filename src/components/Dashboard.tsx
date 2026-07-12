/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  PlusCircle, 
  History, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Compass,
  Milestone,
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { Mission, Recuperation, Wilaya } from '../types';

interface DashboardProps {
  missions: Mission[];
  recuperations: Recuperation[];
  wilayas: Wilaya[];
  onNavigate: (tab: 'accueil' | 'nouvelle_mission' | 'historique' | 'recuperations' | 'parametres', filter?: string) => void;
  nomAgent?: string;
}

export default function Dashboard({ missions, recuperations, wilayas, onNavigate, nomAgent }: DashboardProps) {
  // 1. Calculate recovery days statistics
  const totalDaysAcquired = missions.reduce((sum, m) => sum + m.joursRecuperation, 0);
  const totalDaysConsumed = recuperations.reduce((sum, r) => sum + r.nbJours, 0);
  const availableDays = Math.max(0, totalDaysAcquired - totalDaysConsumed);

  // 2. Calculate payments
  const nonCreditedMissions = missions.filter(m => !m.creditee);
  const totalOutstandingAmount = nonCreditedMissions.reduce((sum, m) => sum + m.montantNet, 0);
  
  const creditedMissions = missions.filter(m => m.creditee);
  const totalCreditedAmount = creditedMissions.reduce((sum, m) => sum + m.montantNet, 0);
  const totalMissionsAmount = missions.reduce((sum, m) => sum + m.montantNet, 0);

  // 3. Additional practical stats
  const totalKilometers = missions.reduce((sum, m) => sum + (m.kilometrage || 0), 0);
  const totalMissionsCount = missions.length;

  // 4. Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    if (hour >= 18 && hour < 22) return 'Bonsoir';
    return 'Bonne nuit';
  };

  // Helper to get Wilaya name
  const getWilayaName = (id: number) => {
    const w = wilayas.find(x => x.idWilaya === id);
    return w ? `${w.code} - ${w.nom}` : `Wilaya #${id}`;
  };

  // Sort missions by dateDepart desc to get latest
  const sortedMissions = [...missions].sort((a, b) => {
    return new Date(b.dateDepart).getTime() - new Date(a.dateDepart).getTime();
  });
  const latestMissions = sortedMissions.slice(0, 3);

  // Sort recuperations by dateDebut desc to get latest
  const sortedRecuperations = [...recuperations].sort((a, b) => {
    return new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime();
  });
  const latestRecuperations = sortedRecuperations.slice(0, 3);

  // Progress calculations
  const consumptionPercentage = totalDaysAcquired > 0 
    ? Math.min(100, Math.round((totalDaysConsumed / totalDaysAcquired) * 100)) 
    : 0;

  const paymentPaidPercent = totalMissionsAmount > 0
    ? Math.min(100, Math.round((totalCreditedAmount / totalMissionsAmount) * 100))
    : 0;

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      
      {/* 1. Header Welcome Card (More Compact) */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-primary-hover dark:from-slate-900 dark:to-slate-800 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-xs">
              S-Mission Manager v1.2.0
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mt-2">
              {getGreeting()}, {nomAgent || 'Bahloul Saif Eddine'}
            </h2>
            <p className="text-white/80 text-[11px] mt-0.5 font-medium max-w-lg leading-relaxed">
              Suivi professionnel des ordres de mission, calcul des indemnités réglementaires et gestion automatique de vos récupérations.
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start md:self-center bg-black/15 dark:bg-slate-950/40 backdrop-blur-md py-1.5 px-3 rounded-xl border border-white/10 text-[10px] text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div className="font-semibold">
              Mode local sécurisé <span className="text-[9px] font-normal opacity-80">(Données privées)</span>
            </div>
          </div>
        </div>

        {/* Mini stats strip inside the welcome banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 relative z-10 text-xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block">Missions Saisies</span>
            <span className="text-lg font-extrabold font-mono">{totalMissionsCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block">Distance Totale</span>
            <span className="text-lg font-extrabold font-mono">{totalKilometers.toLocaleString('fr-FR')} <span className="text-[10px] font-normal">km</span></span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block">Montant Cumulé</span>
            <span className="text-lg font-extrabold font-mono">{totalMissionsAmount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span className="text-[10px] font-normal">DA</span></span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block">Missions Réglées</span>
            <span className="text-lg font-extrabold font-mono">
              {missions.filter(m => m.creditee).length} <span className="text-xs font-normal text-white/50">/ {totalMissionsCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Actions Rapides & Raccourcis (PRIORITY AT THE TOP - Now very compact) */}
      <div className="bg-white dark:bg-[#1E2025] rounded-2xl p-4 border border-[#DDE2EA] dark:border-slate-800 shadow-3xs">
        <h3 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5 font-sans">Actions Rapides & Raccourcis</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <button
            onClick={() => onNavigate('nouvelle_mission')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-brand-light-bg/40 hover:border-brand-primary/20 dark:hover:bg-brand-primary/10 transition-all rounded-xl border border-slate-200/50 dark:border-slate-800/80 group cursor-pointer text-left"
            id="action-new-mission"
          >
            <div className="p-2 bg-brand-primary text-white rounded-lg shadow-xs shrink-0">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">Nouvelle Mission</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block truncate">Calcul automatique</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('recuperations', 'nouveau')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-brand-light-bg/40 hover:border-brand-primary/20 dark:hover:bg-brand-primary/10 transition-all rounded-xl border border-slate-200/50 dark:border-slate-800/80 group cursor-pointer text-left"
            id="action-new-recup"
          >
            <div className="p-2 bg-violet-600 text-white rounded-lg shadow-xs shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">Déclarer un Congé</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block truncate">Consommer mes droits</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('historique')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-brand-light-bg/40 hover:border-brand-primary/20 dark:hover:bg-brand-primary/10 transition-all rounded-xl border border-slate-200/50 dark:border-slate-800/80 group cursor-pointer text-left"
            id="action-history"
          >
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">Historique complet</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block truncate">Filtrer & PDF</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('parametres')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-brand-light-bg/40 hover:border-brand-primary/20 dark:hover:bg-brand-primary/10 transition-all rounded-xl border border-slate-200/50 dark:border-slate-800/80 group cursor-pointer text-left"
            id="action-settings"
          >
            <div className="p-2 bg-slate-600 text-white rounded-lg shadow-xs shrink-0">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">Paramètres</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block truncate">Barèmes, PIN & Sauvegarde</span>
            </div>
          </button>
          
        </div>
      </div>

      {/* 3. Main Analytics & Bento Grid (More Compact cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* RECOVERY CARD */}
        <button
          onClick={() => onNavigate('recuperations')}
          className="flex flex-col justify-between p-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-3xs text-left group hover:shadow-xs hover:border-brand-primary/30 transition-all duration-200 cursor-pointer"
          id="stat-recuperations"
        >
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Jours de Récupération</span>
                  <span className="text-[9px] text-slate-500 font-medium">Droits acquis suite aux missions</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Gérer <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                {availableDays}
              </span>
              <span className="text-xs font-semibold text-slate-500">jours restants</span>
            </div>

            {/* Consumed / Acquired progress bar */}
            <div className="mt-3 space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-violet-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalDaysAcquired > 0 ? (availableDays / totalDaysAcquired) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                <span>Consommés : {totalDaysConsumed} j</span>
                <span>Droits totaux : {totalDaysAcquired} j</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 w-full text-[9px] font-semibold text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Calculé à la minute près par l'algorithme
            </span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">
              {consumptionPercentage}% consommés
            </span>
          </div>
        </button>

        {/* INDEMNITIES / PAYMENTS CARD */}
        <button
          onClick={() => onNavigate('historique', 'non_creditees')}
          className="flex flex-col justify-between p-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-3xs text-left group hover:shadow-xs hover:border-brand-primary/30 transition-all duration-200 cursor-pointer"
          id="stat-payments"
        >
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Indemnités Non Créditées</span>
                  <span className="text-[9px] text-slate-500 font-medium">Montants en attente de paiement</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                Détails <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
                {totalOutstandingAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold text-slate-500">DA</span>
            </div>

            {/* Paid / Pending progress bar */}
            <div className="mt-3 space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${totalMissionsAmount > 0 ? (totalOutstandingAmount / totalMissionsAmount) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 font-mono">
                <span>Déjà Réglé : {totalCreditedAmount.toLocaleString('fr-FR')} DA</span>
                <span>Total dû : {totalMissionsAmount.toLocaleString('fr-FR')} DA</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 w-full text-[9px] font-semibold text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              {nonCreditedMissions.length} mission(s) en attente de virement
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {100 - paymentPaidPercent}% en attente
            </span>
          </div>
        </button>
      </div>

      {/* 4. Recent Items Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LATEST MISSIONS LIST */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 p-4 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-700/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-brand-light-bg dark:bg-slate-700 p-1.5 rounded-lg text-brand-primary dark:text-brand-active-bg">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Dernières Missions</h3>
              </div>
              <button 
                onClick={() => onNavigate('historique')}
                className="text-[10px] font-bold text-brand-primary dark:text-brand-active-bg hover:underline flex items-center gap-0.5"
              >
                Tout voir <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>

            {latestMissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-1.5">
                <Compass className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] text-slate-400 font-medium">Aucune mission enregistrée pour le moment.</p>
                <button
                  onClick={() => onNavigate('nouvelle_mission')}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Saisir ma première mission
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {latestMissions.map((m) => (
                  <div 
                    key={m.idMission}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-brand-light-bg/30 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 border border-slate-100/80 dark:border-slate-850 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {getWilayaName(m.wilayaId)}
                        </span>
                        <span className="text-[8px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.2 rounded uppercase tracking-wider">
                          Zone {m.zoneUtilisee}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold font-mono">
                        <span>Du {new Date(m.dateDepart).toLocaleDateString('fr-FR')}</span>
                        <span>au {new Date(m.dateRetour).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-extrabold font-mono text-slate-850 dark:text-slate-100">
                        {m.montantNet.toLocaleString('fr-FR')} DA
                      </div>
                      <div className="mt-0.5">
                        {m.creditee ? (
                          <span className="text-[7px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded border border-emerald-100 dark:border-emerald-900/30">
                            Créditée
                          </span>
                        ) : (
                          <span className="text-[7px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1 py-0.2 rounded border border-amber-100/60 dark:border-amber-900/30 animate-pulse">
                            En attente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {latestMissions.length > 0 && (
            <div className="text-center pt-2 border-t border-slate-50 dark:border-slate-700/40 mt-2.5">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                Total : {totalMissionsCount} missions actives répertoriées
              </span>
            </div>
          )}
        </div>

        {/* LATEST RECOVERIES LIST */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 p-4 shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-700/50 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-brand-light-bg dark:bg-slate-700 p-1.5 rounded-lg text-brand-primary dark:text-brand-active-bg">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Derniers Congés</h3>
              </div>
              <button 
                onClick={() => onNavigate('recuperations')}
                className="text-[10px] font-bold text-brand-primary dark:text-brand-active-bg hover:underline flex items-center gap-0.5"
              >
                Tout voir <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>

            {latestRecuperations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-1.5">
                <Calendar className="w-8 h-8 text-slate-300" />
                <p className="text-[11px] text-slate-400 font-medium">Aucune récupération consommée pour le moment.</p>
                <button
                  onClick={() => onNavigate('recuperations')}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  Déclarer un congé de récupération
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {latestRecuperations.map((r) => (
                  <div 
                    key={r.idRecuperation}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-brand-light-bg/30 dark:bg-slate-900/40 dark:hover:bg-slate-900/80 border border-slate-100/80 dark:border-slate-850 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Du {new Date(r.dateDebut).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-[11px] text-slate-450">au</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {new Date(r.dateFin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-550 italic truncate max-w-[280px]">
                        {r.commentaire || "Aucun commentaire spécifié"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-extrabold font-mono text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 px-2 py-0.5 rounded-lg">
                        -{r.nbJours} {r.nbJours > 1 ? 'jours' : 'jour'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {latestRecuperations.length > 0 && (
            <div className="text-center pt-2 border-t border-slate-50 dark:border-slate-700/40 mt-2.5">
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                {totalDaysConsumed} jours consommés au total sur {totalDaysAcquired} acquis
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
