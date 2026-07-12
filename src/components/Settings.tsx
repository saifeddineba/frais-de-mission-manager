/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Settings as SettingsIcon, Shield, Database, Calendar, MapPin, BadgePercent, Info, Plus, Trash2, Edit2, AlertCircle, FileDown, Upload, CheckCircle2, Palette, ChevronDown, ChevronUp, Share2, Copy, Check } from 'lucide-react';
import { Bareme, Wilaya, JourFerie, Parametre, AppDatabase, Mission } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface SettingsProps {
  database: AppDatabase;
  onSaveBareme: (bareme: Omit<Bareme, 'idBareme'>, idBareme?: number) => void;
  onToggleBaremeActif: (id: number) => void;
  onDeleteBareme: (id: number) => { success: boolean; error?: string };
  onAddWilaya: (code: number, nom: string, zone: 'Nord' | 'Sud') => { success: boolean; error?: string };
  onUpdateWilaya: (id: number, nom?: string, zone?: 'Nord' | 'Sud') => { success: boolean; error?: string };
  onDeleteWilaya: (id: number) => { success: boolean; error?: string };
  onAddJourFerie: (date: string, libelle: string, type: 'Fixe' | 'Mobile') => { success: boolean; error?: string };
  onDeleteJourFerie: (id: number) => void;
  onSaveSecuritySettings: (pinActive: boolean, biometrieActive: boolean, pinValue?: string) => void;
  onRestoreData: (backupJson: string) => { success: boolean; error?: string };
  onUpdatePlagesHoraires: (repasPlages: Parametre['repasPlages'], nuitPlage: Parametre['nuitPlage']) => void;
  onSaveAgentName: (nom: string) => void;
  onSaveAccentColor?: (color: 'blue' | 'emerald' | 'violet' | 'slate' | 'sunset' | 'teal') => void;
  onSaveLayout?: (layout: 'sidebar' | 'horizontal') => void;
}

type SubTab = 'bareme' | 'apparence' | 'wilayas' | 'jours_feries' | 'securite' | 'sauvegarde' | 'infos';

export default function Settings({
  database,
  onAddRecuperation,
  onDeleteRecuperation,
  onEditMission,
  onSave,
  onCancel,
  onUpdateCreditStatus,
  onDeleteMission,
  ...props
}: SettingsProps & { [key: string]: any }) {
  const [subTab, setSubTab] = useState<SubTab | ''>('');

  const { baremes, wilayas, joursFeries, parametres, missions, recuperations, recuperationMissions } = database;

  // Active (latest) Bareme
  const activeBareme = useMemo(() => {
    return baremes.find(b => b.actif) || baremes[baremes.length - 1];
  }, [baremes]);

  // --- Sub-State for Bareme Form ---
  const [baremeNom, setBaremeNom] = useState('');
  const [montantRepasNord, setMontantRepasNord] = useState(activeBareme.montantRepasNord);
  const [montantRepasSud, setMontantRepasSud] = useState(activeBareme.montantRepasSud);
  const [montantNuiteeNord, setMontantNuiteeNord] = useState(activeBareme.montantNuiteeNord);
  const [montantNuiteeSud, setMontantNuiteeSud] = useState(activeBareme.montantNuiteeSud);
  const [forfaitJournalierNord, setForfaitJournalierNord] = useState(activeBareme.forfaitJournalierNord);
  const [forfaitJournalierSud, setForfaitJournalierSud] = useState(activeBareme.forfaitJournalierSud);
  const [indemniteKilometrique, setIndemniteKilometrique] = useState(activeBareme.indemniteKilometrique);
  const [baremeMessage, setBaremeMessage] = useState<string | null>(null);
  const [editingBaremeId, setEditingBaremeId] = useState<number | null>(null);

  // Automatically calculate Nord & Sud forfait based on business rule: (repas * 2) + nuitée
  React.useEffect(() => {
    setForfaitJournalierNord((montantRepasNord * 2) + montantNuiteeNord);
  }, [montantRepasNord, montantNuiteeNord]);

  React.useEffect(() => {
    setForfaitJournalierSud((montantRepasSud * 2) + montantNuiteeSud);
  }, [montantRepasSud, montantNuiteeSud]);

  // --- Sub-State for Wilaya ---
  const [newWilayaCode, setNewWilayaCode] = useState<number | ''>('');
  const [newWilayaNom, setNewWilayaNom] = useState('');
  const [newWilayaZone, setNewWilayaZone] = useState<'Nord' | 'Sud'>('Nord');
  const [editingWilayaId, setEditingWilayaId] = useState<number | null>(null);
  const [editingWilayaNom, setEditingWilayaNom] = useState('');
  const [wilayaError, setWilayaError] = useState<string | null>(null);

  // --- Sub-State for Jour Ferie ---
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayLabel, setNewHolidayNom] = useState('');
  const [newHolidayType, setNewHolidayType] = useState<'Fixe' | 'Mobile'>('Fixe');
  const [holidayError, setHolidayError] = useState<string | null>(null);

  // --- Sub-State for Security ---
  const [pinActive, setPinActive] = useState(parametres.pinActive);
  const [biometrieActive, setBiometrieActive] = useState(parametres.biometrieActive);
  const [pinValue, setPinValue] = useState(parametres.pin || '');
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // --- Sub-State for Agent Name ---
  const [agentNameInput, setAgentNameInput] = useState(parametres.nomAgent || '');
  const [agentNameMessage, setAgentNameMessage] = useState<string | null>(null);

  // --- Sub-State for Meal Plages ---
  const [plageDejDebut, setPlageDejDebut] = useState(parametres.repasPlages.dejeuner.debut);
  const [plageDejFin, setPlageDejFin] = useState(parametres.repasPlages.dejeuner.fin);
  const [plageDinDebut, setPlageDinerDebut] = useState(parametres.repasPlages.diner.debut);
  const [plageDinFin, setPlageDinerFin] = useState(parametres.repasPlages.diner.fin);
  const [plageNuitDebut, setPlageNuitDebut] = useState(parametres.nuitPlage.debut);
  const [plageNuitFin, setPlageNuitFin] = useState(parametres.nuitPlage.fin);

  // --- Sub-State for Backup / Restore ---
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // --- BAREME ACTIONS ---
  const handleEditBareme = (b: Bareme) => {
    setEditingBaremeId(b.idBareme);
    setBaremeNom(b.nom || '');
    setMontantRepasNord(b.montantRepasNord);
    setMontantRepasSud(b.montantRepasSud);
    setMontantNuiteeNord(b.montantNuiteeNord);
    setMontantNuiteeSud(b.montantNuiteeSud);
    setForfaitJournalierNord(b.forfaitJournalierNord);
    setForfaitJournalierSud(b.forfaitJournalierSud);
    setIndemniteKilometrique(b.indemniteKilometrique);
    
    const formElement = document.getElementById('bareme-form-top');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEditBareme = () => {
    setEditingBaremeId(null);
    setBaremeNom('');
    setMontantRepasNord(activeBareme.montantRepasNord);
    setMontantRepasSud(activeBareme.montantRepasSud);
    setMontantNuiteeNord(activeBareme.montantNuiteeNord);
    setMontantNuiteeSud(activeBareme.montantNuiteeSud);
    setForfaitJournalierNord(activeBareme.forfaitJournalierNord);
    setForfaitJournalierSud(activeBareme.forfaitJournalierSud);
    setIndemniteKilometrique(activeBareme.indemniteKilometrique);
  };

  const handleSaveBareme = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      montantRepasNord <= 0 || montantRepasSud <= 0 ||
      montantNuiteeNord <= 0 || montantNuiteeSud <= 0 ||
      forfaitJournalierNord <= 0 || forfaitJournalierSud <= 0 ||
      indemniteKilometrique <= 0
    ) {
      alert('Toutes les valeurs du barème doivent être supérieures à zéro.');
      return;
    }
    
    props.onSaveBareme({
      nom: baremeNom.trim() || undefined,
      montantRepasNord,
      montantRepasSud,
      montantNuiteeNord,
      montantNuiteeSud,
      forfaitJournalierNord,
      forfaitJournalierSud,
      indemniteKilometrique,
      dateDebutValidite: new Date().toISOString().split('T')[0],
      actif: editingBaremeId ? (baremes.find(b => b.idBareme === editingBaremeId)?.actif ?? true) : true
    }, editingBaremeId || undefined);

    setBaremeNom('');
    if (editingBaremeId) {
      setBaremeMessage('Le barème a été mis à jour avec succès !');
      setEditingBaremeId(null);
    } else {
      setBaremeMessage('Nouveau barème enregistré avec succès ! Appliqué automatiquement pour les futures missions.');
    }
    setTimeout(() => setBaremeMessage(null), 5000);
  };

  // --- WILAYA ACTIONS ---
  const handleAddWilaya = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWilayaCode || !newWilayaNom) {
      setWilayaError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    const result = props.onAddWilaya(Number(newWilayaCode), newWilayaNom.trim(), newWilayaZone);
    if (result.success) {
      setNewWilayaCode('');
      setNewWilayaNom('');
      setNewWilayaZone('Nord');
      setWilayaError(null);
    } else {
      setWilayaError(result.error || 'Erreur inconnue.');
    }
  };

  const handleStartEditWilaya = (w: Wilaya) => {
    setEditingWilayaId(w.idWilaya);
    setEditingWilayaNom(w.nom);
  };

  const handleSaveEditWilaya = (id: number) => {
    if (!editingWilayaNom.trim()) return;
    const result = props.onUpdateWilaya(id, editingWilayaNom.trim());
    if (result.success) {
      setEditingWilayaId(null);
      setEditingWilayaNom('');
      setWilayaError(null);
    } else {
      setWilayaError(result.error || 'Erreur.');
    }
  };

  const handleDeleteWilaya = (w: Wilaya) => {
    // Check if used
    const isUsed = missions.some(m => m.wilayaId === w.idWilaya);
    if (isUsed) {
      setWilayaError(`Impossible de supprimer la wilaya "${w.nom}" car elle est référencée dans une ou plusieurs missions de l'historique.`);
      return;
    }

    if (confirm(`Voulez-vous supprimer définitivement la wilaya "${w.nom}" ?`)) {
      const result = props.onDeleteWilaya(w.idWilaya);
      if (result.success) {
        setWilayaError(null);
      } else {
        setWilayaError(result.error || 'Erreur.');
      }
    }
  };

  // --- HOLIDAY ACTIONS ---
  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayLabel) {
      setHolidayError('Veuillez renseigner tous les champs.');
      return;
    }

    let finalDate = newHolidayDate;
    if (newHolidayType === 'Fixe') {
      // Input date YYYY-MM-DD, extract MM-DD
      const parts = newHolidayDate.split('-');
      if (parts.length === 3) {
        finalDate = `${parts[1]}-${parts[2]}`; // MM-DD
      }
    }

    const result = props.onAddJourFerie(finalDate, newHolidayLabel.trim(), newHolidayType);
    if (result.success) {
      setNewHolidayDate('');
      setNewHolidayNom('');
      setHolidayError(null);
    } else {
      setHolidayError(result.error || 'Erreur.');
    }
  };

  const handleDeleteHoliday = (id: number) => {
    if (confirm('Voulez-vous supprimer ce jour férié ?')) {
      props.onDeleteJourFerie(id);
    }
  };

  // --- BACKUP & RESTORE ACTIONS ---

  const getBackupJsonString = () => {
    return JSON.stringify({
      missions,
      wilayas,
      baremes,
      joursFeries,
      recuperations,
      recuperationMissions,
      parametres
    }, null, 2);
  };

  const triggerExport = async () => {
    const backupJson = getBackupJsonString();
    const fileName = `s_mission_manager_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;

    if (Capacitor.isNativePlatform()) {
      try {
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: backupJson,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        
        await Share.share({
          title: 'S-Mission Manager Sauvegarde',
          text: 'Fichier de sauvegarde des données S-Mission Manager',
          url: writeResult.uri,
          dialogTitle: 'Sauvegarder / Partager le fichier .json'
        });
        
        setShareSuccess('Sauvegarde exportée avec succès !');
        setTimeout(() => setShareSuccess(null), 3000);
      } catch (err: any) {
        console.error('Capacitor export error:', err);
        alert('Erreur d\'exportation Capacitor : ' + (err.message || err));
      }
    } else {
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyBackup = () => {
    const backupJson = getBackupJsonString();
    navigator.clipboard.writeText(backupJson)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy', err);
      });
  };

  const handleShareBackup = async () => {
    setShareSuccess(null);
    const backupJson = getBackupJsonString();
    const fileName = `s_mission_manager_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;

    if (Capacitor.isNativePlatform()) {
      await triggerExport();
      return;
    }

    if (navigator.share) {
      try {
        const file = new File([backupJson], fileName, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'S-Mission Manager Sauvegarde',
            text: 'Fichier de sauvegarde des données S-Mission Manager'
          });
          setShareSuccess('Sauvegarde partagée avec succès !');
          setTimeout(() => setShareSuccess(null), 3000);
        } else {
          await navigator.share({
            title: 'S-Mission Manager Sauvegarde',
            text: backupJson
          });
          setShareSuccess('Sauvegarde partagée !');
          setTimeout(() => setShareSuccess(null), 3000);
        }
      } catch (err) {
        console.log('Web Share failed', err);
      }
    } else {
      alert('Le partage natif n\'est pas supporté sur ce navigateur.');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreMessage(null);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = props.onRestoreData(text);
        if (result.success) {
          setRestoreMessage('Base de données restaurée avec succès ! Rechargement de la page...');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setRestoreError(result.error || 'Erreur lors de la restauration du fichier.');
        }
      } catch (err: any) {
        setRestoreError('Erreur de parsing JSON. Le fichier est corrompu ou invalide.');
      }
    };
    reader.readAsText(file);
  };

  // --- SAVE TIME PLAGES ---
  const handleSavePlages = () => {
    props.onUpdatePlagesHoraires(
      {
        dejeuner: { debut: plageDejDebut, fin: plageDejFin },
        diner: { debut: plageDinDebut, fin: plageDinFin },
        souper: { debut: plageNuitDebut, fin: '23:59' } // mapping as required
      },
      { debut: plageNuitDebut, fin: plageNuitFin }
    );
    alert('Plages horaires de décompte enregistrées avec succès !');
  };

  const handleSaveSecurityForm = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityMessage(null);

    if (pinActive && pinValue.length < 4) {
      setSecurityError('Le code PIN doit comporter un minimum de 4 chiffres.');
      return;
    }

    props.onSaveSecuritySettings(pinActive, biometrieActive, pinValue);
    setSecurityMessage('Paramètres de sécurité enregistrés !');
    setTimeout(() => setSecurityMessage(null), 3000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-sans pb-10">
      
      {/* 1. Barèmes & Plages Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'bareme' ? '' : 'bareme')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'bareme'}
        >
          <div className="flex items-center gap-3">
            <BadgePercent className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Barèmes & Plages</span>
              <span className="text-[10px] text-slate-400 font-medium block">Configurez les taux de remboursement et plages de décompte</span>
            </div>
          </div>
          {subTab === 'bareme' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'bareme' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in" id="bareme-form-top">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {editingBaremeId ? `Modifier le barème #${editingBaremeId}` : 'Gestion des barèmes'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configurez les taux officiels de remboursement. Toute modification génère une nouvelle version du barème ou met à jour le barème sélectionné.</p>
              </div>

              {baremeMessage && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{baremeMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveBareme} className="space-y-6">
                
                {/* Nom du Barème */}
                <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Nom du barème (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={baremeNom}
                    onChange={e => setBaremeNom(e.target.value)}
                    placeholder='Ex: "Avenant N°1", "Taux Cadres Supérieurs", etc.'
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                    id="input-rate-name"
                  />
                </div>

                {/* Zone Nord Section */}
                <div className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tarifs Zone Nord</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Indemnité Repas (DA)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={montantRepasNord}
                        onChange={e => setMontantRepasNord(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                        id="input-rate-repas-nord"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Indemnité Nuitée (DA)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={montantNuiteeNord}
                        onChange={e => setMontantNuiteeNord(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                        id="input-rate-nuitee-nord"
                      />
                    </div>
                  </div>
                </div>

                {/* Zone Sud Section */}
                <div className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tarifs Zone Sud</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Indemnité Repas (DA)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={montantRepasSud}
                        onChange={e => setMontantRepasSud(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                        id="input-rate-repas-sud"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Indemnité Nuitée (DA)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={montantNuiteeSud}
                        onChange={e => setMontantNuiteeSud(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                        id="input-rate-nuitee-sud"
                      />
                    </div>
                  </div>
                </div>

                {/* Common Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Indemnité kilométrique (DA / km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={indemniteKilometrique}
                      onChange={e => setIndemniteKilometrique(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm focus:border-brand-primary focus:outline-hidden dark:text-white"
                      id="input-rate-ik"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold px-4 py-2.5 transition-all w-fit cursor-pointer"
                    id="btn-save-new-bareme"
                  >
                    {editingBaremeId ? 'Enregistrer les modifications' : 'Enregistrer comme nouveau barème actif'}
                  </button>
                  {editingBaremeId && (
                    <button
                      type="button"
                      onClick={handleCancelEditBareme}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-bold px-4 py-2.5 transition-all w-fit cursor-pointer"
                    >
                      Annuler la modification
                    </button>
                  )}
                </div>
              </form>

              {/* Historical Barèmes logs */}
            <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Barèmes d'indemnités enregistrés</h4>
                <span className="text-[10px] text-slate-400 font-medium">Total : {baremes.length}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...baremes].reverse().map(b => (
                  <div 
                    key={b.idBareme} 
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 bg-white dark:bg-slate-800 shadow-2xs ${
                      b.actif 
                        ? 'border-emerald-500/30 bg-emerald-50/5 dark:border-emerald-500/20' 
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="max-w-[70%]">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                            {b.nom ? b.nom : `Barème Standard #${b.idBareme}`}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            Validité : Depuis le {new Date(b.dateDebutValidite).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {b.actif ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200/50">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Inactif
                          </span>
                        )}
                      </div>

                      {/* Rates grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Zone Nord :</span>
                          <p className="font-semibold text-slate-700 dark:text-slate-350">
                            Repas : <span className="font-bold text-slate-800 dark:text-slate-100">{b.montantRepasNord ?? (b as any).montantRepas} DA</span>
                          </p>
                          <p className="font-semibold text-slate-700 dark:text-slate-350 mt-0.5">
                            Nuitée : <span className="font-bold text-slate-800 dark:text-slate-100">{b.montantNuiteeNord ?? (b as any).montantNuitee} DA</span>
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Zone Sud :</span>
                          <p className="font-semibold text-slate-700 dark:text-slate-350">
                            Repas : <span className="font-bold text-slate-800 dark:text-slate-100">{b.montantRepasSud ?? (b as any).montantRepas} DA</span>
                          </p>
                          <p className="font-semibold text-slate-700 dark:text-slate-350 mt-0.5">
                            Nuitée : <span className="font-bold text-slate-800 dark:text-slate-100">{b.montantNuiteeSud ?? (b as any).montantNuitee} DA</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-[10px] flex items-center justify-between text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100 dark:border-slate-700/40">
                        <span className="font-medium">Indemnité Kilométrique :</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{b.indemniteKilometrique} DA/km</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                      <div>
                        {b.actif ? (
                          <button
                            type="button"
                            onClick={() => props.onToggleBaremeActif(b.idBareme)}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                            title="Désactiver ce barème"
                          >
                            Désactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => props.onToggleBaremeActif(b.idBareme)}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                            title="Activer ce barème"
                          >
                            Activer ce barème
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditBareme(b)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg cursor-pointer border border-slate-200/50 dark:border-slate-700/50 transition-colors"
                          title="Modifier ce barème"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Voulez-vous supprimer définitivement ce barème ?")) {
                              const res = props.onDeleteBareme(b.idBareme);
                              if (res && !res.success) {
                                alert(res.error);
                              }
                            }
                          }}
                          className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer border border-rose-200/30 dark:border-rose-900/30 transition-colors"
                          title="Supprimer ce barème"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Apparence & Thème Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'apparence' ? '' : 'apparence')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'apparence'}
        >
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Apparence & Thème</span>
              <span className="text-[10px] text-slate-400 font-medium block">Personnalisez le visuel, l'accent de couleur et la disposition</span>
            </div>
          </div>
          {subTab === 'apparence' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'apparence' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">Apparence & Thème de l'application</h3>
              <p className="text-xs text-slate-500 mt-1">Personnalisez le visuel, l'identification de l'agent et les couleurs de S-Mission Manager.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Couleur d'accentuation (Skin de l'application)</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: 'blue', label: 'Bleu Royal', class: 'bg-[#005AC1]' },
                  { id: 'emerald', label: 'Vert Émeraude', class: 'bg-[#059669]' },
                  { id: 'violet', label: 'Améthyste', class: 'bg-[#7C3AED]' },
                  { id: 'slate', label: 'Ardoise Moderne', class: 'bg-[#475569]' },
                  { id: 'sunset', label: 'Sahara Sunset (Or)', class: 'bg-[#D97706]' },
                  { id: 'teal', label: 'Brise Marine (Turquoise)', class: 'bg-[#0D9488]' },
                ].map(skin => (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => {
                      if (props.onSaveAccentColor) {
                        props.onSaveAccentColor(skin.id as any);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${
                      (parametres.accentColor || 'blue') === skin.id
                        ? 'border-brand-primary bg-brand-light-bg/40 scale-102 ring-2 ring-brand-primary/20'
                        : 'border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${skin.class} mb-2 shadow-xs`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{skin.label}</span>
                    {(parametres.accentColor || 'blue') === skin.id && (
                      <span className="text-[10px] font-semibold text-brand-primary mt-1">Actif</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Disposition des écrans (Layout selection) */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Disposition des écrans (Layout)</h4>
              <p className="text-xs text-slate-500">Choisissez l'organisation visuelle de S-Mission Manager sur ordinateur.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (props.onSaveLayout) {
                      props.onSaveLayout('sidebar');
                    }
                  }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                    (parametres.layout || 'sidebar') === 'sidebar'
                      ? 'border-brand-primary bg-brand-light-bg/40 ring-2 ring-brand-primary/20'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 text-slate-600 dark:text-slate-300 flex items-center justify-center w-10 h-10">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">Barre latérale classique</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Une disposition standard avec un menu de navigation vertical à gauche, idéal pour naviguer rapidement.</p>
                    {(parametres.layout || 'sidebar') === 'sidebar' && (
                      <span className="text-[10px] font-bold text-brand-primary mt-2 inline-block">Actif</span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (props.onSaveLayout) {
                      props.onSaveLayout('horizontal');
                    }
                  }}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                    parametres.layout === 'horizontal'
                      ? 'border-brand-primary bg-brand-light-bg/40 ring-2 ring-brand-primary/20'
                      : 'border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 text-slate-600 dark:text-slate-300 flex items-center justify-center w-10 h-10">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-sans">Navigation supérieure (Bandeau horizontal)</h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Le menu se déplace en haut dans un bandeau horizontal épuré. Libère 100% de la largeur d'écran pour les tableaux d'historique !</p>
                    {parametres.layout === 'horizontal' && (
                      <span className="text-[10px] font-bold text-brand-primary mt-2 inline-block">Actif</span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Agent profile section (Avenant N°1) */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Identification de l'agent (Avenant N°1)</h4>
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 space-y-1.5 font-sans">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nom de l'agent connecté</label>
                  <input
                    type="text"
                    value={agentNameInput}
                    onChange={e => setAgentNameInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden"
                    placeholder="Entrez votre nom et prénom"
                    id="input-agent-name-apparence"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (agentNameInput.trim()) {
                      props.onSaveAgentName(agentNameInput.trim());
                      setAgentNameMessage('Nom de l\'agent mis à jour avec succès !');
                      setTimeout(() => setAgentNameMessage(null), 3000);
                    }
                  }}
                  className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold rounded-xl text-xs py-2.5 px-4 transition-all shrink-0 cursor-pointer"
                  id="btn-save-agent-name-apparence"
                >
                  Mettre à jour
                </button>
              </div>
              {agentNameMessage && (
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{agentNameMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Gestion Wilayas Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'wilayas' ? '' : 'wilayas')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'wilayas'}
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Gestion Wilayas</span>
              <span className="text-[10px] text-slate-400 font-medium block">Configurez les 58 wilayas et gérez vos Wilayas personnalisées</span>
            </div>
          </div>
          {subTab === 'wilayas' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'wilayas' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Gestion des Wilayas</h3>
              <p className="text-xs text-slate-500 mt-1">Visualisez les 58 wilayas préchargées, ajoutez-en de nouvelles, ou modifiez vos ajouts personnalisés.</p>
            </div>

            {wilayaError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3 flex gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{wilayaError}</span>
              </div>
            )}

            {/* Add Custom Wilaya Form */}
            <form onSubmit={handleAddWilaya} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Code Wilaya</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  placeholder="Ex: 59"
                  value={newWilayaCode}
                  onChange={e => setNewWilayaCode(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                  id="wilaya-input-code"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Nom de la Wilaya</label>
                <input
                  type="text"
                  placeholder="Ex: Nouvelle Wilaya"
                  value={newWilayaNom}
                  onChange={e => setNewWilayaNom(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                  id="wilaya-input-nom"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Zone géographique</label>
                <select
                  value={newWilayaZone}
                  onChange={e => setNewWilayaZone(e.target.value as 'Nord' | 'Sud')}
                  className="w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                  id="wilaya-input-zone"
                >
                  <option value="Nord">Zone Nord</option>
                  <option value="Sud">Zone Sud</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer h-9"
                id="btn-add-wilaya"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter la Wilaya</span>
              </button>
            </form>

            {/* List with edit triggers */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl bg-slate-50/20 dark:bg-slate-900/10">
              {[...wilayas]
                .sort((a, b) => a.code - b.code)
                .map(w => {
                  const isEditing = editingWilayaId === w.idWilaya;
                  
                  return (
                    <div
                      key={w.idWilaya}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 border border-slate-100 dark:border-slate-800 rounded text-slate-500 text-[10px] font-bold">
                          {String(w.code).padStart(2, '0')}
                        </span>
                        
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingWilayaNom}
                            onChange={e => setEditingWilayaNom(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden"
                            id={`wilaya-edit-${w.idWilaya}`}
                          />
                        ) : (
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {w.nom}
                          </span>
                        )}

                        {!w.utilisateur && (
                          <span className="text-[8px] bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 px-1 rounded">Officiel</span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const newZone = w.zone === 'Nord' ? 'Sud' : 'Nord';
                            props.onUpdateWilaya(w.idWilaya, undefined, newZone);
                          }}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            w.zone === 'Nord' 
                              ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-100 dark:border-blue-900/30 hover:bg-blue-100/50' 
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100/50'
                          }`}
                          title="Cliquez pour changer la zone (Nord / Sud)"
                        >
                          Zone {w.zone || 'Nord'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEditWilaya(w.idWilaya)}
                              className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold px-2 py-1 rounded"
                              id={`wilaya-save-btn-${w.idWilaya}`}
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={() => setEditingWilayaId(null)}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded"
                              id={`wilaya-cancel-btn-${w.idWilaya}`}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            {w.utilisateur && (
                              <>
                                <button
                                  onClick={() => handleStartEditWilaya(w)}
                                  className="text-slate-400 hover:text-blue-500 p-1"
                                  title="Modifier"
                                  id={`wilaya-edit-icon-${w.idWilaya}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWilaya(w)}
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                  title="Supprimer"
                                  id={`wilaya-delete-icon-${w.idWilaya}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Jours fériés Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'jours_feries' ? '' : 'jours_feries')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'jours_feries'}
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Jours fériés</span>
              <span className="text-[10px] text-slate-400 font-medium block">Gérez la liste des fêtes fixes et mobiles pour le décompte</span>
            </div>
          </div>
          {subTab === 'jours_feries' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'jours_feries' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Gestion des Jours Fériés</h3>
              <p className="text-xs text-slate-500 mt-1">Gérez la liste des fêtes fixes et mobiles. Les récupérations sautent automatiquement ces jours dans le décompte.</p>
            </div>

            {holidayError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3 flex gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{holidayError}</span>
              </div>
            )}

            {/* Add holiday form */}
            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Type</label>
                <select
                  value={newHolidayType}
                  onChange={e => setNewHolidayType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750 px-2.5 py-1.5 text-xs"
                  id="holiday-type"
                >
                  <option value="Fixe">Fête Fixe (Chaque année)</option>
                  <option value="Mobile">Fête Mobile (Année précise)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={e => setNewHolidayDate(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
                  id="holiday-date"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Libellé</label>
                <input
                  type="text"
                  placeholder="Ex: Achoura, Aïd,..."
                  value={newHolidayLabel}
                  onChange={e => setNewHolidayNom(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                  id="holiday-label"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer h-9 w-full"
                id="btn-add-holiday"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </form>

            {/* Holidays List */}
            <div className="space-y-2">
              {joursFeries.map(jf => (
                <div
                  key={jf.idJourFerie}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">{jf.libelle}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {jf.type === 'Fixe' ? `Chaque ${jf.date.split('-')[1]}/${jf.date.split('-')[0]}` : `Le ${new Date(jf.date).toLocaleDateString('fr-FR')}`} ({jf.type})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteHoliday(jf.idJourFerie)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Supprimer"
                    id={`holiday-delete-btn-${jf.idJourFerie}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Sécurité & PIN Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'securite' ? '' : 'securite')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'securite'}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Sécurité & PIN</span>
              <span className="text-[10px] text-slate-400 font-medium block">Protégez l'accès à l'application par un code PIN</span>
            </div>
          </div>
          {subTab === 'securite' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'securite' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Sécurité & Protection</h3>
              <p className="text-xs text-slate-500 mt-1">Protégez l'accès à l'application par un code PIN et activez la simulation biométrique.</p>
            </div>

            {securityError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3 flex gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{securityError}</span>
              </div>
            )}

            {securityMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{securityMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveSecurityForm} className="space-y-5">
              
              {/* Toggle PIN */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Protéger par code PIN</span>
                  <p className="text-[10px] text-slate-400">Demande le code PIN à l'ouverture de l'application</p>
                </div>
                <input
                  type="checkbox"
                  checked={pinActive}
                  onChange={e => setPinActive(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer"
                  id="security-pin-active"
                />
              </div>

              {/* Enter PIN field */}
              {pinActive && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                    Saisir le Code PIN (minimum 4 chiffres)
                  </label>
                  <input
                    type="password"
                    maxLength={8}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Ex: 1234"
                    value={pinValue}
                    onChange={e => setPinValue(e.target.value.replace(/\D/g, ''))}
                    required={pinActive}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:border-blue-500 text-slate-800 dark:text-white"
                    id="security-pin-value"
                  />
                  <p className="text-[9px] text-slate-400 italic">Entrez uniquement des chiffres de 0 à 9.</p>
                </div>
              )}

              {/* Toggle Biometrics */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">Authentification biométrique</span>
                  <p className="text-[10px] text-slate-400">Permet d'utiliser l'empreinte digitale pour bypasser le PIN</p>
                </div>
                <input
                  type="checkbox"
                  checked={biometrieActive}
                  onChange={e => setBiometrieActive(e.target.checked)}
                  disabled={!pinActive}
                  className="w-5 h-5 rounded text-blue-600 cursor-pointer disabled:opacity-50"
                  id="security-bio-active"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 py-2.5 transition-all w-fit cursor-pointer"
                id="security-save-settings"
              >
                Enregistrer les paramètres de sécurité
              </button>

            </form>
          </div>
        )}
      </div>

      {/* 6. Sauvegarde DB Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'sauvegarde' ? '' : 'sauvegarde')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'sauvegarde'}
          id="setting-tab-backup"
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Sauvegarde DB</span>
              <span className="text-[10px] text-slate-400 font-medium block">Sauvegardez ou restaurez vos données complètes</span>
            </div>
          </div>
          {subTab === 'sauvegarde' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'sauvegarde' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Sauvegarde & Restauration complète</h3>
              <p className="text-xs text-slate-500 mt-1">Téléchargez un fichier .json sécurisé contenant toutes vos données locales pour les restaurer sur un autre appareil.</p>
            </div>

            {restoreMessage && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{restoreMessage}</span>
              </div>
            )}

            {restoreError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3 flex gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{restoreError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Export Panel */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-250 block">Exporter la Base Room</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Sauvegardez l'intégralité de vos tables (Missions, Récupérations, Barèmes, Wilayas). 
                    <span className="block mt-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                      💡 Astuce mobile : Si le téléchargement direct est bloqué sur votre écran d'accueil, utilisez l'option "Partager" ou "Copier".
                    </span>
                  </p>
                </div>

                {/* Status alerts for copy/share */}
                {copySuccess && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-[10px] py-1.5 px-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1.5 animate-fade-in font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Sauvegarde copiée dans le presse-papiers !</span>
                  </div>
                )}

                {shareSuccess && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-[10px] py-1.5 px-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1.5 animate-fade-in font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{shareSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={triggerExport}
                    className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 py-2.5 transition-all cursor-pointer w-full text-center"
                    id="btn-export-backup"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Télécharger le fichier .json</span>
                  </button>

                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button
                      onClick={handleShareBackup}
                      className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold px-4 py-2.5 transition-all cursor-pointer w-full text-center"
                      id="btn-share-backup"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Partager la sauvegarde (Mobile)</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyBackup}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold px-4 py-2.5 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer w-full text-center"
                    id="btn-copy-backup"
                  >
                    {copySuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>Copier le texte JSON de sauvegarde</span>
                  </button>
                </div>
              </div>

              {/* Import Panel */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-250 block">Restaurer une sauvegarde</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Importez un fichier de sauvegarde précédemment exporté. Attention: cela écrasera vos données actuelles.</p>
                </div>
                
                <label className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold px-4 py-2 w-fit cursor-pointer transition-all mt-2 border border-slate-200 dark:border-slate-700">
                  <Upload className="w-4 h-4" />
                  <span>Sélectionner le fichier</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                    id="btn-import-backup"
                  />
                </label>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 7. Informations App Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setSubTab(subTab === 'infos' ? '' : 'infos')}
          className="w-full py-4.5 px-5 flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all cursor-pointer border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-700/60 data-[expanded=true]:bg-slate-50/50 dark:data-[expanded=true]:bg-slate-900/10"
          data-expanded={subTab === 'infos'}
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 block">Informations App</span>
              <span className="text-[10px] text-slate-400 font-medium block">Détails de conformité, version de base de données, etc.</span>
            </div>
          </div>
          {subTab === 'infos' ? <ChevronUp className="w-4.5 h-4.5 text-slate-400" /> : <ChevronDown className="w-4.5 h-4.5 text-slate-400" />}
        </button>
        {subTab === 'infos' && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-700/60 space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">À propos de l'application</h3>
              <p className="text-xs text-slate-500 mt-1">S-Mission Manager est développé en stricte conformité avec le cahier des charges fonctionnel.</p>
            </div>

            {/* Agent profile section (Added in Avenant N°1) */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Identification de l'agent (Avenant N°1)</h4>
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 space-y-1.5 font-sans">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nom de l'agent connecté</label>
                  <input
                    type="text"
                    value={agentNameInput}
                    onChange={e => setAgentNameInput(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden"
                    placeholder="Entrez votre nom et prénom"
                    id="input-agent-name-settings"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (agentNameInput.trim()) {
                      props.onSaveAgentName(agentNameInput.trim());
                      setAgentNameMessage('Nom de l\'agent mis à jour avec succès !');
                      setTimeout(() => setAgentNameMessage(null), 3000);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs py-2.5 px-4 transition-all shrink-0 cursor-pointer"
                  id="btn-save-agent-name"
                >
                  Mettre à jour
                </button>
              </div>
              {agentNameMessage && (
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{agentNameMessage}</p>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-slate-400 font-medium">Nom officiel :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">S-Mission Manager</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-slate-400 font-medium">Version logicielle :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">1.0.0 (Production Ready)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-slate-400 font-medium">Version Base de données :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">Room (SQLite local abstraction) v1</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-slate-400 font-medium">Auteur / Développeur :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">s-suivie des mission</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-slate-400 font-medium">Cahier des charges :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">Version 1.0 (Juillet 2026)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-slate-50 dark:border-slate-800 pb-3">
                <span className="text-slate-400 font-medium">Environnement technique :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">Jetpack Compose UI Mode (SPA Engine)</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pb-3">
                <span className="text-slate-400 font-medium">Version AGP (Gradle Plugin) :</span>
                <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-emerald-600 dark:text-emerald-400">9.2.1 (Mis à jour depuis 8.13.0)</span>
              </div>

              <div className="p-4 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl border border-blue-50 dark:border-blue-900/30 text-[10px] text-slate-400 leading-relaxed">
                <strong>S-Mission Manager</strong> est une application Android native d'usage personnel fonctionnant à 100% hors-ligne. Aucune donnée n'est envoyée sur internet, garantissant une confidentialité totale pour l'administration et le suivi des frais professionnels.
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
