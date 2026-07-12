/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Car, 
  Compass, 
  PieChart, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Activity 
} from 'lucide-react';
import { Mission, Recuperation, Wilaya } from '../types';

interface StatisticsProps {
  missions: Mission[];
  recuperations: Recuperation[];
  wilayas: Wilaya[];
}

export default function Statistics({ missions, recuperations, wilayas }: StatisticsProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  // --- 1. CORE DATA AGGREGATION ---
  const stats = useMemo(() => {
    const totalMissions = missions.length;
    const totalBrut = missions.reduce((sum, m) => sum + m.montantBrut, 0);
    const totalNet = missions.reduce((sum, m) => sum + m.montantNet, 0);
    const totalAvances = missions.reduce((sum, m) => sum + m.avance, 0);
    const totalKilometres = missions.reduce((sum, m) => sum + (m.kilometrage || 0), 0);
    const avgNetPerMission = totalMissions > 0 ? Math.round(totalNet / totalMissions) : 0;

    // Credit status
    const missionsCreditees = missions.filter(m => m.creditee);
    const totalRegle = missionsCreditees.reduce((sum, m) => sum + m.montantNet, 0);
    const totalAttente = totalNet - totalRegle;

    // Recovery days
    const totalAcquis = missions.reduce((sum, m) => sum + m.joursRecuperation, 0);
    const totalConsommes = recuperations.reduce((sum, r) => sum + r.nbJours, 0);
    const totalRestants = Math.max(0, totalAcquis - totalConsommes);

    // Geographic zones
    let countNord = 0;
    let countSud = 0;
    let netNord = 0;
    let netSud = 0;

    missions.forEach(m => {
      if (m.zoneUtilisee === 'Sud') {
        countSud++;
        netSud += m.montantNet;
      } else {
        countNord++;
        netNord += m.montantNet;
      }
    });

    // Transport types
    const transportBreakdown: Record<string, { count: number; net: number }> = {};
    missions.forEach(m => {
      const type = m.typeTransport || 'Véhicule personnel';
      if (!transportBreakdown[type]) {
        transportBreakdown[type] = { count: 0, net: 0 };
      }
      transportBreakdown[type].count++;
      transportBreakdown[type].net += m.montantNet;
    });

    // Monthly breakdown (sorted chronological)
    const monthlyData: Record<string, { label: string; count: number; net: number; key: string }> = {};
    missions.forEach(m => {
      if (!m.dateDepart) return;
      const date = new Date(m.dateDepart);
      const year = date.getFullYear();
      const monthIdx = date.getMonth(); // 0-11
      const monthNames = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
      const monthLabel = monthNames[monthIdx];
      const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { label: `${monthLabel} ${year}`, count: 0, net: 0, key };
      }
      monthlyData[key].count++;
      monthlyData[key].net += m.montantNet;
    });

    const sortedMonthly = Object.values(monthlyData).sort((a, b) => a.key.localeCompare(b.key));

    // Top Destination Wilayas (top 5)
    const wilayaBreakdown: Record<number, { count: number; net: number; id: number }> = {};
    missions.forEach(m => {
      if (!wilayaBreakdown[m.wilayaId]) {
        wilayaBreakdown[m.wilayaId] = { count: 0, net: 0, id: m.wilayaId };
      }
      wilayaBreakdown[m.wilayaId].count++;
      wilayaBreakdown[m.wilayaId].net += m.montantNet;
    });

    const sortedWilayas = Object.values(wilayaBreakdown)
      .map(wb => {
        const wil = wilayas.find(w => w.idWilaya === wb.id);
        return {
          ...wb,
          name: wil ? `${wil.code} - ${wil.nom}` : `Wilaya #${wb.id}`,
          zone: wil ? wil.zone : 'Nord'
        };
      })
      .sort((a, b) => b.net - a.net)
      .slice(0, 5);

    return {
      totalMissions,
      totalBrut,
      totalNet,
      totalAvances,
      totalKilometres,
      avgNetPerMission,
      totalRegle,
      totalAttente,
      totalAcquis,
      totalConsommes,
      totalRestants,
      countNord,
      countSud,
      netNord,
      netSud,
      transportBreakdown: Object.entries(transportBreakdown).map(([type, val]) => ({ type, ...val })),
      sortedMonthly,
      sortedWilayas
    };
  }, [missions, recuperations, wilayas]);

  if (stats.totalMissions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-8">
        <div className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-2xl">
          <BarChart3 className="w-12 h-12" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Statistiques indisponibles</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Vous devez d'abord enregistrer au moins une mission pour activer le module de statistiques détaillées et de graphiques.
        </p>
      </div>
    );
  }

  // Max value for monthly chart normalization
  const maxMonthlyNet = stats.sortedMonthly.length > 0 
    ? Math.max(...stats.sortedMonthly.map(m => m.net), 1000)
    : 1000;

  // Max value for wilaya chart normalization
  const maxWilayaNet = stats.sortedWilayas.length > 0
    ? Math.max(...stats.sortedWilayas.map(w => w.net), 1)
    : 1;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      
      {/* HEADER TITLE */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-brand-primary text-white rounded-xl shadow-xs">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Analyses & Statistiques de Suivi</h2>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Vue globale de vos frais professionnels et droits acquis</span>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total missions */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Missions</span>
            <Compass className="w-4 h-4 text-brand-primary shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white">{stats.totalMissions}</span>
            <span className="text-[10px] font-bold text-slate-400">actives</span>
          </div>
          <p className="text-[9px] text-slate-400">
            Moyenne : <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{stats.avgNetPerMission.toLocaleString('fr-FR')} DA</span> / mission
          </p>
        </div>

        {/* Total Budget Net */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Indemnités Net</span>
            <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white">
              {stats.totalNet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] font-bold text-slate-400">DA</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-400">
            <span className="text-emerald-500">{Math.round((stats.totalRegle / stats.totalNet) * 100)}% réglés</span>
            <span>•</span>
            <span>Brut: {stats.totalBrut.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Recoveries */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Droits Récupérations</span>
            <Calendar className="w-4 h-4 text-violet-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white">{stats.totalRestants}</span>
            <span className="text-[10px] font-bold text-slate-400">jours restants</span>
          </div>
          <p className="text-[9px] text-slate-400">
            Acquis : <span className="font-mono font-bold text-violet-600 dark:text-violet-400">{stats.totalAcquis}j</span> • Consommés : <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{stats.totalConsommes}j</span>
          </p>
        </div>

        {/* Avances Total */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Avances Perçues</span>
            <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white">
              {stats.totalAvances.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] font-bold text-slate-400">DA</span>
          </div>
          <p className="text-[9px] text-slate-400">
            Kilométrage total : <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{stats.totalKilometres.toLocaleString('fr-FR')} km</span>
          </p>
        </div>
      </div>

      {/* DOUBLE GRAPHICS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Monthly distribution chart */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Évolution mensuelle des indemnités (Net)</h3>
            </div>

            {stats.sortedMonthly.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Aucune donnée mensuelle.</div>
            ) : (
              <div className="pt-6 pb-2">
                {/* Visual Chart Canvas */}
                <div className="relative h-48 flex items-end justify-around gap-2 px-2 border-b border-slate-200/60 dark:border-slate-700/80">
                  
                  {stats.sortedMonthly.map((m) => {
                    const heightPercent = Math.max(8, Math.round((m.net / maxMonthlyNet) * 100));
                    const isHovered = hoveredBar === m.key;
                    return (
                      <div 
                        key={m.key} 
                        className="flex-1 flex flex-col items-center group relative cursor-pointer"
                        onMouseEnter={() => setHoveredBar(m.key)}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        {/* Tooltip on hover */}
                        <div className={`absolute bottom-full mb-2 bg-slate-900/90 text-white dark:bg-white dark:text-slate-950 font-sans p-2 rounded-lg text-[10px] leading-tight text-center z-10 transition-opacity pointer-events-none w-32 shadow-lg ${
                          isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
                        }`}>
                          <p className="font-bold">{m.label}</p>
                          <p className="font-mono text-brand-active-bg dark:text-brand-primary mt-0.5">{m.net.toLocaleString('fr-FR')} DA</p>
                          <p className="text-[9px] text-slate-300 dark:text-slate-500 font-semibold mt-0.5">{m.count} mission(s)</p>
                        </div>

                        {/* Visual Bar Column */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 relative overflow-hidden ${
                            isHovered 
                              ? 'bg-brand-primary shadow-md shadow-brand-primary/20 scale-x-105' 
                              : 'bg-brand-primary/75 dark:bg-brand-primary/60 hover:bg-brand-primary'
                          }`}
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-white/20" />
                        </div>

                        {/* Label */}
                        <span className="text-[8px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 mt-2 rotate-12 sm:rotate-0 truncate max-w-full text-center">
                          {m.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between border-t border-slate-50 dark:border-slate-700/40 pt-3 mt-4">
            <span>Passez votre curseur sur une colonne pour les détails</span>
            <span className="text-brand-primary font-bold">Total cumulé : {stats.totalNet.toLocaleString('fr-FR')} DA</span>
          </div>
        </div>

        {/* 2. Regle vs Attente Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Statut des paiements</h3>
            </div>

            <div className="py-4 space-y-5">
              {/* Pie/Ring simulated container */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  {/* Clean circular border visualization */}
                  <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3" className="dark:stroke-slate-800" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15.915" 
                      fill="none" 
                      stroke="#10B981" 
                      strokeWidth="3" 
                      strokeDasharray={`${stats.totalNet > 0 ? (stats.totalRegle / stats.totalNet) * 100 : 0} ${100 - (stats.totalNet > 0 ? (stats.totalRegle / stats.totalNet) * 100 : 0)}`}
                    />
                  </svg>
                  <div className="text-center font-sans z-10">
                    <span className="text-2xl font-extrabold font-mono text-emerald-500">
                      {stats.totalNet > 0 ? Math.round((stats.totalRegle / stats.totalNet) * 100) : 0}%
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-widest mt-0.5">Réglé</span>
                  </div>
                </div>
              </div>

              {/* Legend lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/50 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Déjà réglé :</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {stats.totalRegle.toLocaleString('fr-FR')} DA
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/50 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>En attente :</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {stats.totalAttente.toLocaleString('fr-FR')} DA
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 border-t border-slate-50 dark:border-slate-700/40 pt-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Missions créditées par rapport aux saisies</span>
          </div>
        </div>
      </div>

      {/* THIRD LINE BREAKDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Wilayas favorites */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50 dark:border-slate-700/40">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Top 5 des Wilayas (Frais Nets accumulés)</h3>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Classement</span>
            </div>

            <div className="space-y-4 py-2">
              {stats.sortedWilayas.map((w, index) => {
                const percent = Math.max(12, Math.round((w.net / maxWilayaNet) * 100));
                return (
                  <div key={w.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 flex items-center justify-center font-bold font-mono">
                          {index + 1}
                        </span>
                        {w.name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                        <span>{w.net.toLocaleString('fr-FR')} DA</span>
                        <span className="text-[9px] font-semibold text-slate-400">({w.count}m)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          index === 0 ? 'bg-brand-primary' : index === 1 ? 'bg-violet-500' : index === 2 ? 'bg-teal-500' : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-50 dark:border-slate-700/40 pt-3 mt-4">
            Données basées sur les barèmes de frais kilométriques et journaliers.
          </div>
        </div>

        {/* Zones & Transport Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/50 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-50 dark:border-slate-700/40">
              <Car className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Zones & Modes de transport</h3>
            </div>

            <div className="space-y-5">
              
              {/* Geographic distribution */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Répartition Nord / Sud</span>
                
                <div className="flex rounded-full overflow-hidden h-4 border border-slate-100 dark:border-slate-800">
                  <div 
                    style={{ width: `${stats.totalMissions > 0 ? (stats.countNord / stats.totalMissions) * 100 : 50}%` }}
                    className="bg-sky-500 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-300"
                    title={`Nord: ${stats.countNord} missions`}
                  >
                    {stats.countNord > 0 && `Nord (${stats.countNord})`}
                  </div>
                  <div 
                    style={{ width: `${stats.totalMissions > 0 ? (stats.countSud / stats.totalMissions) * 100 : 50}%` }}
                    className="bg-amber-500 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-300"
                    title={`Sud: ${stats.countSud} missions`}
                  >
                    {stats.countSud > 0 && `Sud (${stats.countSud})`}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Zone Nord: <span className="font-mono text-slate-700 dark:text-slate-350">{stats.netNord.toLocaleString('fr-FR')} DA</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Zone Sud: <span className="font-mono text-slate-700 dark:text-slate-350">{stats.netSud.toLocaleString('fr-FR')} DA</span></span>
                  </div>
                </div>
              </div>

              {/* Transport breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-700/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Indemnités par Mode de transport</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stats.transportBreakdown.map((tb, index) => (
                    <div 
                      key={tb.type}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850/60 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[120px]">
                          {tb.type}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{tb.count} mission(s)</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 shrink-0">
                        {tb.net.toLocaleString('fr-FR')} DA
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-50 dark:border-slate-700/40 pt-3 mt-4">
            Rapports de frais par zone d'affectation géoclimatique réglementaire.
          </div>
        </div>
      </div>
    </div>
  );
}
