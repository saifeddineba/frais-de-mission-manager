/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase, restoreBackup } from './utils/storage';
import { App as CapApp } from '@capacitor/app';
import { AppDatabase, Mission, Recuperation, RecuperationMission, Wilaya, JourFerie, Bareme, Parametre } from './types';
import SecurityScreen from './components/SecurityScreen';
import OnboardingScreen from './components/OnboardingScreen';
import Dashboard from './components/Dashboard';
import NewMission from './components/NewMission';
import MissionHistory from './components/MissionHistory';
import Recoveries from './components/Recoveries';
import Settings from './components/Settings';
import Statistics from './components/Statistics';
import { MissionCalculator } from './utils/calculator';
import { Home, PlusCircle, History, Calendar, Settings as SettingsIcon, ShieldAlert, Sun, Moon, Lock, Shield, BarChart3, Sparkles } from 'lucide-react';

export default function App() {
  // Main local-first database state
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  
  // Security locks state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);

  // Navigations and quick deep-links states
  const [activeTab, setActiveTab] = useState<'accueil' | 'nouvelle_mission' | 'historique' | 'recuperations' | 'statistiques' | 'parametres'>('accueil');
  const [activeSectionTab, setActiveSectionTab] = useState<string | undefined>(undefined);

  // Edit mission buffer
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  // Onboarding state
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    return localStorage.getItem('s_mission_manager_onboarding_done') === 'true' && !!db.parametres.nomAgent;
  });

  const handleOnboardingComplete = (username: string, pinActive: boolean, pinValue: string) => {
    const updated = {
      ...db,
      parametres: {
        ...db.parametres,
        nomAgent: username,
        pinActive: pinActive,
        pin: pinActive ? pinValue : ''
      }
    };
    setDb(updated);
    saveDatabase(updated);
    localStorage.setItem('s_mission_manager_onboarding_done', 'true');
    setOnboardingDone(true);
    if (pinActive && pinValue) {
      setIsUnlockedState(true);
    }
  };

  // 1. Initial lock checks and application-wide theme syncing
  useEffect(() => {
    if (db.parametres.pinActive && db.parametres.pin && db.parametres.pin.length >= 4) {
      setIsUnlocked(false);
    } else {
      setIsUnlocked(true);
    }
  }, [db.parametres.pinActive, db.parametres.pin]);

  // Track state of unlocking
  const [isUnlockedState, setIsUnlockedState] = useState(false);
  const actuallyLocked = db.parametres.pinActive && db.parametres.pin && db.parametres.pin.length >= 4 && !isUnlockedState;

  // Apply visual theme to the document root element
  useEffect(() => {
    const handleThemeSync = () => {
      const selectedTheme = db.parametres.theme;
      const root = document.documentElement;
      
      if (selectedTheme === 'Sombre') {
        root.classList.add('dark');
      } else if (selectedTheme === 'Clair') {
        root.classList.remove('dark');
      } else {
        // Automatic preference match
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    handleThemeSync();

    // Listen to media changes if theme is set to automatic
    if (db.parametres.theme === 'Automatique') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => handleThemeSync();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [db.parametres.theme]);

  // Handle mobile back button to prevent the app from closing when exiting a module
  useEffect(() => {
    let backButtonListener: any = null;

    const setupListener = async () => {
      try {
        backButtonListener = await CapApp.addListener('backButton', () => {
          if (editingMission) {
            setEditingMission(null);
            setActiveTab('historique');
          } else if (activeTab !== 'accueil') {
            setActiveTab('accueil');
          } else {
            CapApp.exitApp();
          }
        });
      } catch (err) {
        // Non-capacitor/web environment fallback
        console.debug('Not running in native mobile shell or Capacitor App plugin is unavailable:', err);
      }
    };

    setupListener();

    return () => {
      if (backButtonListener && typeof backButtonListener.remove === 'function') {
        backButtonListener.remove();
      }
    };
  }, [activeTab, editingMission]);

  // Quick navigation helper
  const handleNavigate = (
    tab: 'accueil' | 'nouvelle_mission' | 'historique' | 'recuperations' | 'statistiques' | 'parametres',
    subSectionTab?: string
  ) => {
    setActiveTab(tab);
    setActiveSectionTab(subSectionTab);
    
    // Reset editing state if navigating away manually
    if (tab !== 'nouvelle_mission') {
      setEditingMission(null);
    }
  };

  // Helper to fetch latest active barème
  const getActiveBareme = (): Bareme => {
    return db.baremes.find(b => b.actif) || db.baremes[db.baremes.length - 1];
  };

  // --- DATABASE WRITE WRAPPER ---
  const updateDbAndSave = (updated: AppDatabase) => {
    setDb(updated);
    saveDatabase(updated);
  };

  // --- CORE CALLBACKS FOR MISSION CRUD ---

  const handleSaveMission = (savedMission: Mission) => {
    const updatedMissions = [...db.missions];
    const existingIndex = updatedMissions.findIndex(m => m.idMission === savedMission.idMission);
    
    if (existingIndex >= 0) {
      // Modifying an existing mission
      const oldMission = updatedMissions[existingIndex];
      // Calculate how many days have been already consumed by recuperations
      const daysConsumed = oldMission.joursRecuperation - oldMission.joursRestants;
      
      // Calculate new remaining balance
      const newRestants = Math.max(0, savedMission.joursRecuperation - daysConsumed);
      
      updatedMissions[existingIndex] = {
        ...savedMission,
        joursRestants: newRestants,
        dateModification: new Date().toISOString()
      };
    } else {
      // Adding new mission
      const newMission: Mission = {
        ...savedMission,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };
      updatedMissions.push(newMission);
    }

    updateDbAndSave({
      ...db,
      missions: updatedMissions
    });

    setEditingMission(null);
    setActiveTab('historique');
  };

  const handleDeleteMission = (idMission: number): { success: boolean; error?: string } => {
    const target = db.missions.find(m => m.idMission === idMission);
    if (!target) return { success: false, error: 'Mission introuvable.' };

    // Safety constraint: "La suppression est autorisée uniquement lorsque les jours de récupération n'ont pas été consommés"
    if (target.joursRestants !== target.joursRecuperation) {
      return {
        success: false,
        error: "Impossible de supprimer: certains jours de récupération de cette mission ont déjà été consommés."
      };
    }

    const updatedMissions = db.missions.filter(m => m.idMission !== idMission);
    updateDbAndSave({
      ...db,
      missions: updatedMissions
    });

    return { success: true };
  };

  const handleUpdateCreditStatus = (idMission: number, creditee: boolean, dateCredit?: string) => {
    const updatedMissions = db.missions.map(m => {
      if (m.idMission === idMission) {
        return {
          ...m,
          creditee,
          dateCredit,
          dateModification: new Date().toISOString()
        };
      }
      return m;
    });

    updateDbAndSave({
      ...db,
      missions: updatedMissions
    });
  };

  const handleEditMissionTrigger = (mission: Mission) => {
    setEditingMission(mission);
    setActiveTab('nouvelle_mission');
  };

  // --- CORE CALLBACKS FOR RECOVERIES ---

  const handleAddRecuperation = (
    newRecup: Omit<Recuperation, 'idRecuperation' | 'dateCreation'>,
    allocations: { idMission: number; joursConsommes: number }[]
  ): { success: boolean; error?: string } => {
    const idRecup = Date.now();
    
    // 1. Check if we have sufficient days on active missions
    for (const alloc of allocations) {
      const m = db.missions.find(x => x.idMission === alloc.idMission);
      if (!m || m.joursRestants < alloc.joursConsommes) {
        return {
          success: false,
          error: `Erreur d'allocation : Mission à destination de wilaya ${m ? m.wilayaId : 'inconnue'} ne dispose pas de suffisamment de jours.`
        };
      }
    }

    // 2. Subtract from missions
    const updatedMissions = db.missions.map(m => {
      const match = allocations.find(a => a.idMission === m.idMission);
      if (match) {
        return {
          ...m,
          joursRestants: Math.max(0, m.joursRestants - match.joursConsommes),
          dateModification: new Date().toISOString()
        };
      }
      return m;
    });

    // 3. Create Recuperation object
    const createdRecup: Recuperation = {
      idRecuperation: idRecup,
      ...newRecup,
      dateCreation: new Date().toISOString()
    };

    // 4. Create RecuperationMissions link objects
    const newLinks: RecuperationMission[] = allocations.map((alloc, idx) => ({
      id: idRecup + idx + Math.floor(Math.random() * 100),
      idMission: alloc.idMission,
      idRecuperation: idRecup,
      joursConsommes: alloc.joursConsommes
    }));

    updateDbAndSave({
      ...db,
      missions: updatedMissions,
      recuperations: [...db.recuperations, createdRecup],
      recuperationMissions: [...db.recuperationMissions, ...newLinks]
    });

    return { success: true };
  };

  const handleDeleteRecuperation = (idRecuperation: number) => {
    // 1. Find all links associated with this recovery to restore balances
    const linksToRestore = db.recuperationMissions.filter(l => l.idRecuperation === idRecuperation);
    
    // 2. Add back to missions' balances
    const updatedMissions = db.missions.map(m => {
      const match = linksToRestore.find(l => l.idMission === m.idMission);
      if (match) {
        return {
          ...m,
          joursRestants: Math.min(m.joursRecuperation, m.joursRestants + match.joursConsommes),
          dateModification: new Date().toISOString()
        };
      }
      return m;
    });

    // 3. Remove links and recovery records
    const updatedLinks = db.recuperationMissions.filter(l => l.idRecuperation !== idRecuperation);
    const updatedRecups = db.recuperations.filter(r => r.idRecuperation !== idRecuperation);

    updateDbAndSave({
      ...db,
      missions: updatedMissions,
      recuperations: updatedRecups,
      recuperationMissions: updatedLinks
    });
  };

  // --- CORE CALLBACKS FOR SETTINGS / DATA DICTIONARY ---

  const handleSaveBareme = (newBaremeData: Omit<Bareme, 'idBareme'>, idBareme?: number) => {
    let nextBaremes: Bareme[] = [];

    // Force forfait calculations based on Requirement 2
    const forcedNord = (newBaremeData.montantRepasNord * 2) + newBaremeData.montantNuiteeNord;
    const forcedSud = (newBaremeData.montantRepasSud * 2) + newBaremeData.montantNuiteeSud;

    const dataWithForfait = {
      ...newBaremeData,
      forfaitJournalierNord: forcedNord,
      forfaitJournalierSud: forcedSud
    };

    if (idBareme !== undefined) {
      // Editing existing bareme in-place
      nextBaremes = db.baremes.map(b => {
        if (b.idBareme === idBareme) {
          return {
            ...b,
            ...dataWithForfait
          };
        }
        return b;
      });
    } else {
      // Deactivate others
      const updatedBaremes = db.baremes.map(b => ({ ...b, actif: false }));
      const newId = Math.max(...db.baremes.map(b => b.idBareme), 0) + 1;
      const newBareme: Bareme = {
        idBareme: newId,
        ...dataWithForfait,
        actif: true
      };
      nextBaremes = [...updatedBaremes, newBareme];
    }

    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      nextBaremes,
      db.joursFeries,
      db.parametres
    );

    updateDbAndSave({
      ...db,
      baremes: nextBaremes,
      missions: recalcedMissions
    });
  };

  const handleToggleBaremeActif = (id: number) => {
    const target = db.baremes.find(b => b.idBareme === id);
    if (!target) return;

    const willBeActif = !target.actif;
    const nextBaremes = db.baremes.map(b => {
      if (b.idBareme === id) {
        return { ...b, actif: willBeActif };
      }
      if (willBeActif) {
        return { ...b, actif: false };
      }
      return b;
    });

    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      nextBaremes,
      db.joursFeries,
      db.parametres
    );

    updateDbAndSave({
      ...db,
      baremes: nextBaremes,
      missions: recalcedMissions
    });
  };

  const handleDeleteBareme = (id: number): { success: boolean; error?: string } => {
    if (db.baremes.length <= 1) {
      return { success: false, error: "Impossible de supprimer le dernier barème restant." };
    }

    const nextBaremes = db.baremes.filter(b => b.idBareme !== id);
    const hasActive = nextBaremes.some(b => b.actif);
    if (!hasActive && nextBaremes.length > 0) {
      nextBaremes[nextBaremes.length - 1].actif = true;
    }

    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      nextBaremes,
      db.joursFeries,
      db.parametres
    );

    updateDbAndSave({
      ...db,
      baremes: nextBaremes,
      missions: recalcedMissions
    });

    return { success: true };
  };

  const handleAddWilaya = (code: number, nom: string, zone?: 'Nord' | 'Sud'): { success: boolean; error?: string } => {
    if (db.wilayas.some(w => w.code === code)) {
      return { success: false, error: `Une wilaya avec le code ${code} existe déjà.` };
    }
    const newId = Math.max(...db.wilayas.map(w => w.idWilaya)) + 1;
    const newW: Wilaya = { idWilaya: newId, code, nom, zone: zone || 'Nord', utilisateur: true };
    
    updateDbAndSave({
      ...db,
      wilayas: [...db.wilayas, newW]
    });
    return { success: true };
  };

  const handleUpdateWilaya = (id: number, nom?: string, zone?: 'Nord' | 'Sud'): { success: boolean; error?: string } => {
    const updated = db.wilayas.map(w => {
      if (w.idWilaya === id) {
        return { 
          ...w, 
          ...(nom !== undefined ? { nom } : {}), 
          ...(zone !== undefined ? { zone } : {}) 
        };
      }
      return w;
    });

    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      db.baremes,
      db.joursFeries,
      db.parametres
    );

    updateDbAndSave({ 
      ...db, 
      wilayas: updated,
      missions: recalcedMissions
    });
    return { success: true };
  };

  const handleDeleteWilaya = (id: number): { success: boolean; error?: string } => {
    const isUsed = db.missions.some(m => m.wilayaId === id);
    if (isUsed) {
      return { success: false, error: 'Cette wilaya est déjà utilisée.' };
    }
    const updated = db.wilayas.filter(w => w.idWilaya !== id);
    updateDbAndSave({ ...db, wilayas: updated });
    return { success: true };
  };

  const handleAddJourFerie = (date: string, libelle: string, type: 'Fixe' | 'Mobile'): { success: boolean; error?: string } => {
    if (db.joursFeries.some(jf => jf.date === date && jf.type === type)) {
      return { success: false, error: 'Ce jour férié est déjà enregistré.' };
    }
    const newId = Math.max(...db.joursFeries.map(jf => jf.idJourFerie), 0) + 1;
    const newJf: JourFerie = { idJourFerie: newId, date, libelle, type };
    
    const nextJoursFeries = [...db.joursFeries, newJf];
    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      db.baremes,
      nextJoursFeries,
      db.parametres
    );

    updateDbAndSave({
      ...db,
      joursFeries: nextJoursFeries,
      missions: recalcedMissions
    });
    return { success: true };
  };

  const handleDeleteJourFerie = (id: number) => {
    const updated = db.joursFeries.filter(jf => jf.idJourFerie !== id);
    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      db.baremes,
      updated,
      db.parametres
    );

    updateDbAndSave({ 
      ...db, 
      joursFeries: updated,
      missions: recalcedMissions
    });
  };

  const handleSaveSecuritySettings = (pinActive: boolean, biometrieActive: boolean, pinValue?: string) => {
    updateDbAndSave({
      ...db,
      parametres: {
        ...db.parametres,
        pinActive,
        biometrieActive,
        pin: pinValue
      }
    });
  };

  const handleUpdatePlagesHoraires = (repasPlages: Parametre['repasPlages'], nuitPlage: Parametre['nuitPlage']) => {
    const updatedParams = {
      ...db.parametres,
      repasPlages,
      nuitPlage
    };

    const recalcedMissions = MissionCalculator.recalculateMissions(
      db.missions,
      db.baremes,
      db.joursFeries,
      updatedParams
    );

    updateDbAndSave({
      ...db,
      parametres: updatedParams,
      missions: recalcedMissions
    });
  };

  const handleSaveAgentName = (nom: string) => {
    updateDbAndSave({
      ...db,
      parametres: {
        ...db.parametres,
        nomAgent: nom
      }
    });
  };

  const handleSaveAccentColor = (color: 'blue' | 'emerald' | 'violet' | 'slate' | 'sunset' | 'teal') => {
    updateDbAndSave({
      ...db,
      parametres: {
        ...db.parametres,
        accentColor: color
      }
    });
  };

  const handleSaveLayout = (layout: 'sidebar' | 'horizontal') => {
    updateDbAndSave({
      ...db,
      parametres: {
        ...db.parametres,
        layout: layout
      }
    });
  };

  const handleRestoreData = (backupJson: string): { success: boolean; error?: string } => {
    try {
      const restored = restoreBackup(backupJson);
      setDb(restored);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Safe Lock triggers
  const handleLockApp = () => {
    setIsUnlockedState(false);
  };

  const skinStyles = {
    blue: {
      '--brand-primary': '#005AC1',
      '--brand-primary-hover': '#004494',
      '--brand-light-bg': '#EFF1F8',
      '--brand-active-bg': '#D3E4FF',
      '--brand-active-text': '#001D39',
    },
    emerald: {
      '--brand-primary': '#059669',
      '--brand-primary-hover': '#047857',
      '--brand-light-bg': '#ECFDF5',
      '--brand-active-bg': '#D1FAE5',
      '--brand-active-text': '#064E3B',
    },
    violet: {
      '--brand-primary': '#7C3AED',
      '--brand-primary-hover': '#6D28D9',
      '--brand-light-bg': '#F5F3FF',
      '--brand-active-bg': '#EDE9FE',
      '--brand-active-text': '#4C1D95',
    },
    slate: {
      '--brand-primary': '#475569',
      '--brand-primary-hover': '#334155',
      '--brand-light-bg': '#F1F5F9',
      '--brand-active-bg': '#E2E8F0',
      '--brand-active-text': '#0F172A',
    },
    sunset: {
      '--brand-primary': '#D97706',
      '--brand-primary-hover': '#B45309',
      '--brand-light-bg': '#FFFBEB',
      '--brand-active-bg': '#FEF3C7',
      '--brand-active-text': '#78350F',
    },
    teal: {
      '--brand-primary': '#0D9488',
      '--brand-primary-hover': '#0F766E',
      '--brand-light-bg': '#F0FDFA',
      '--brand-active-bg': '#CCFBF1',
      '--brand-active-text': '#115E59',
    }
  };

  const currentSkin = db.parametres.accentColor || 'blue';
  const activeSkinVariables = skinStyles[currentSkin as keyof typeof skinStyles] || skinStyles.blue;

  return (
    <div 
      style={activeSkinVariables as React.CSSProperties}
      className="min-h-screen flex flex-col bg-[#F7F9FC] dark:bg-[#111318] text-[#1A1C1E] dark:text-[#E2E2E9] transition-colors duration-200"
    >
      
      {/* 1. RENDER SECURITY SHIELD IF ACTIVE */}
      {actuallyLocked ? (
        <SecurityScreen
          storedPin={db.parametres.pin || ''}
          isBiometricActive={db.parametres.biometrieActive}
          onUnlocked={() => setIsUnlockedState(true)}
        />
      ) : !onboardingDone ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : (
        /* RENDER APP SHELL */
        <>
          {/* Top Application Bar - Premium Glassmorphic style */}
          <header className="sticky top-0 bg-white/70 dark:bg-[#111318]/75 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/70 z-30 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-blue-500 dark:from-brand-primary dark:to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-primary/25 text-white ring-2 ring-white/10 dark:ring-slate-800/60 transition-transform hover:scale-105">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-none tracking-tight">S-Mission Manager</h1>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">Administration locale sécurisée</span>
              </div>
            </div>

            {db.parametres.layout === 'horizontal' && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-900/30 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/40">
                <button
                  onClick={() => handleNavigate('accueil')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'accueil'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-450 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                  id="header-nav-home"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Tableau de bord</span>
                </button>
                <button
                  onClick={() => handleNavigate('nouvelle_mission')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'nouvelle_mission'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-450 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                  id="header-nav-new-mission"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nouvelle mission</span>
                </button>
                <button
                  onClick={() => handleNavigate('historique')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'historique'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-450 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                  id="header-nav-history"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Historique</span>
                </button>
                <button
                  onClick={() => handleNavigate('recuperations')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'recuperations'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-450 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                  id="header-nav-recups"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Récupérations</span>
                </button>
                <button
                  onClick={() => handleNavigate('statistiques')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'statistiques'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-450 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                  id="header-nav-stats"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Statistiques</span>
                </button>
                <button
                  onClick={() => handleNavigate('parametres')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'parametres'
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-450 hover:bg-slate-250 dark:hover:bg-slate-800/60'
                  }`}
                  id="header-nav-settings"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Paramètres</span>
                </button>
              </div>
            )}

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-2">
              
              {/* Quick Lock Button */}
              {db.parametres.pinActive && db.parametres.pin && (
                <button
                  onClick={handleLockApp}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-brand-light-bg dark:bg-slate-800/80 border border-[#DDE2EA] dark:border-slate-700/50 transition-all cursor-pointer"
                  title="Verrouiller l'application"
                  id="toolbar-lock-app"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {/* Theme Cycle Button */}
              <button
                onClick={() => {
                  const themes: Parametre['theme'][] = ['Clair', 'Sombre', 'Automatique'];
                  const curIdx = themes.indexOf(db.parametres.theme);
                  const nextTheme = themes[(curIdx + 1) % themes.length];
                  updateDbAndSave({
                    ...db,
                    parametres: { ...db.parametres, theme: nextTheme }
                  });
                }}
                className="flex items-center gap-1.5 p-2 text-xs font-semibold rounded-xl bg-brand-light-bg dark:bg-slate-800/80 border border-[#DDE2EA] dark:border-slate-700/50 text-[#1A1C1E] dark:text-slate-300 hover:bg-[#DDE2EA] dark:hover:bg-slate-700 transition-all cursor-pointer"
                title="Changer de thème"
                id="toolbar-toggle-theme"
              >
                {db.parametres.theme === 'Clair' ? (
                  <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
                ) : db.parametres.theme === 'Sombre' ? (
                  <Moon className="w-4 h-4 text-blue-400" />
                ) : (
                  <span className="flex items-center gap-1 text-[10px] px-1 font-bold">Auto</span>
                )}
              </button>
            </div>
          </header>

          {/* Core Body Container */}
          <div className="flex-1 flex w-full max-w-7xl mx-auto">
            
            {/* DESKTOP SIDEBAR DRAWER (Sleek, Floating Side-Deck Design) */}
            {db.parametres.layout !== 'horizontal' && (
              <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/50 dark:border-slate-800/40 px-5 py-6 shrink-0 bg-white/40 dark:bg-[#111318]/20 backdrop-blur-xs">
                <div className="space-y-6">
                  {/* Small Profile Snapshot inside the sidebar */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-light-bg/80 to-brand-light-bg/30 dark:from-slate-900/60 dark:to-slate-900/10 border border-brand-primary/10 dark:border-slate-800/50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-primary text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {(db.parametres.nomAgent || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Agent Actif</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {db.parametres.nomAgent || 'Saif Eddine'}
                      </p>
                    </div>
                  </div>

                  <nav className="space-y-2">
                    <button
                      onClick={() => handleNavigate('accueil')}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-xs font-bold rounded-2xl transition-all duration-255 group cursor-pointer ${
                        activeTab === 'accueil'
                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:translate-x-1'
                      }`}
                      id="sidebar-home"
                    >
                      <Home className="w-4 h-4 shrink-0" />
                      <span>Tableau de bord</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('nouvelle_mission')}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-xs font-bold rounded-2xl transition-all duration-255 group cursor-pointer ${
                        activeTab === 'nouvelle_mission'
                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:translate-x-1'
                      }`}
                      id="sidebar-new-mission"
                    >
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span>Nouvelle mission</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('historique')}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-xs font-bold rounded-2xl transition-all duration-255 group cursor-pointer ${
                        activeTab === 'historique'
                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:translate-x-1'
                      }`}
                      id="sidebar-history"
                    >
                      <History className="w-4 h-4 shrink-0" />
                      <span>Historique</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('recuperations')}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-xs font-bold rounded-2xl transition-all duration-255 group cursor-pointer ${
                        activeTab === 'recuperations'
                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:translate-x-1'
                      }`}
                      id="sidebar-recups"
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Récupérations</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('statistiques')}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-xs font-bold rounded-2xl transition-all duration-255 group cursor-pointer ${
                        activeTab === 'statistiques'
                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:translate-x-1'
                      }`}
                      id="sidebar-stats"
                    >
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      <span>Statistiques</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('parametres')}
                      className={`flex items-center gap-3 w-full px-4 py-3.5 text-xs font-bold rounded-2xl transition-all duration-255 group cursor-pointer ${
                        activeTab === 'parametres'
                          ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:translate-x-1'
                      }`}
                      id="sidebar-settings"
                    >
                      <SettingsIcon className="w-4 h-4 shrink-0" />
                      <span>Paramètres</span>
                    </button>
                  </nav>
                </div>
              </aside>
            )}

            {/* ACTIVE MODULE CONTAINER VIEWPORT */}
            <main className="flex-1 p-4 sm:p-6 overflow-hidden pb-24 md:pb-6">
              
              {activeTab === 'accueil' && (
                <Dashboard
                  missions={db.missions}
                  recuperations={db.recuperations}
                  wilayas={db.wilayas}
                  onNavigate={handleNavigate}
                  nomAgent={db.parametres.nomAgent}
                />
              )}

              {activeTab === 'nouvelle_mission' && (
                <NewMission
                  wilayas={db.wilayas}
                  activeBareme={getActiveBareme()}
                  parametres={db.parametres}
                  joursFeries={db.joursFeries}
                  editingMission={editingMission}
                  onSave={handleSaveMission}
                  onCancel={() => handleNavigate('accueil')}
                />
              )}

              {activeTab === 'historique' && (
                <MissionHistory
                  missions={db.missions}
                  wilayas={db.wilayas}
                  baremes={db.baremes}
                  parametres={db.parametres}
                  onEditMission={handleEditMissionTrigger}
                  onDeleteMission={handleDeleteMission}
                  onUpdateCreditStatus={handleUpdateCreditStatus}
                />
              )}

              {activeTab === 'recuperations' && (
                <Recoveries
                  missions={db.missions}
                  recuperations={db.recuperations}
                  recuperationMissions={db.recuperationMissions}
                  wilayas={db.wilayas}
                  joursFeries={db.joursFeries}
                  onAddRecuperation={handleAddRecuperation}
                  onDeleteRecuperation={handleDeleteRecuperation}
                  activeSectionTab={activeSectionTab}
                />
              )}

              {activeTab === 'statistiques' && (
                <Statistics
                  missions={db.missions}
                  recuperations={db.recuperations}
                  wilayas={db.wilayas}
                />
              )}

              {activeTab === 'parametres' && (
                <Settings
                  database={db}
                  onSaveBareme={handleSaveBareme}
                  onToggleBaremeActif={handleToggleBaremeActif}
                  onDeleteBareme={handleDeleteBareme}
                  onAddWilaya={handleAddWilaya}
                  onUpdateWilaya={handleUpdateWilaya}
                  onDeleteWilaya={handleDeleteWilaya}
                  onAddJourFerie={handleAddJourFerie}
                  onDeleteJourFerie={handleDeleteJourFerie}
                  onSaveSecuritySettings={handleSaveSecuritySettings}
                  onRestoreData={handleRestoreData}
                  onUpdatePlagesHoraires={handleUpdatePlagesHoraires}
                  onSaveAgentName={handleSaveAgentName}
                  onSaveAccentColor={handleSaveAccentColor}
                  onSaveLayout={handleSaveLayout}
                />
              )}

            </main>
          </div>

          {/* RESPONSIVE BOTTOM NAVIGATION BAR (Visible on small screens/mobiles) */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-light-bg dark:bg-[#1E2025] border-t border-[#DDE2EA] dark:border-slate-800/80 px-2 py-2.5 flex justify-around items-center z-30 shadow-lg">
            
            <button
              onClick={() => handleNavigate('accueil')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl text-center w-14 transition-all ${
                activeTab === 'accueil' ? 'text-brand-primary dark:text-brand-active-bg' : 'text-[#44474E] dark:text-[#C2C6CF]'
              }`}
              id="bottom-nav-home"
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Accueil</span>
            </button>

            <button
              onClick={() => handleNavigate('nouvelle_mission')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl text-center w-14 transition-all ${
                activeTab === 'nouvelle_mission' ? 'text-brand-primary dark:text-brand-active-bg' : 'text-[#44474E] dark:text-[#C2C6CF]'
              }`}
              id="bottom-nav-new"
            >
              <PlusCircle className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Ajouter</span>
            </button>

            <button
              onClick={() => handleNavigate('historique')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl text-center w-14 transition-all ${
                activeTab === 'historique' ? 'text-brand-primary dark:text-brand-active-bg' : 'text-[#44474E] dark:text-[#C2C6CF]'
              }`}
              id="bottom-nav-history"
            >
              <History className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Missions</span>
            </button>

            <button
              onClick={() => handleNavigate('recuperations')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl text-center w-14 transition-all ${
                activeTab === 'recuperations' ? 'text-brand-primary dark:text-brand-active-bg' : 'text-[#44474E] dark:text-[#C2C6CF]'
              }`}
              id="bottom-nav-recups"
            >
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Récup.</span>
            </button>

            <button
              onClick={() => handleNavigate('statistiques')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl text-center w-14 transition-all ${
                activeTab === 'statistiques' ? 'text-brand-primary dark:text-brand-active-bg' : 'text-[#44474E] dark:text-[#C2C6CF]'
              }`}
              id="bottom-nav-stats"
            >
              <BarChart3 className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Stats</span>
            </button>

            <button
              onClick={() => handleNavigate('parametres')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl text-center w-14 transition-all ${
                activeTab === 'parametres' ? 'text-brand-primary dark:text-brand-active-bg' : 'text-[#44474E] dark:text-[#C2C6CF]'
              }`}
              id="bottom-nav-settings"
            >
              <SettingsIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold">Param.</span>
            </button>

          </nav>
        </>
      )}

    </div>
  );
}
