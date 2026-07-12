import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingScreenProps {
  onComplete: (username: string, pinActive: boolean, pinValue: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [username, setUsername] = useState('');
  const [pinActive, setPinActive] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pinActive && pinValue.length < 4) {
      setError('Le code PIN de sécurité doit comporter au moins 4 chiffres.');
      return;
    }

    const finalUsername = username.trim() || 's-utilisateur';
    onComplete(finalUsername, pinActive, pinValue);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative premium background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {/* Modern iOS Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-50 dark:ring-blue-950/40">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            S-Mission Manager
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[280px]">
            Bienvenue ! Configurons votre profil pour un décompte d'indemnités parfait.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom d'utilisateur */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: s-utilisateur"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-3.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all"
              />
            </div>
            <span className="text-[10px] text-slate-400 block px-1">
              Laissé vide, le nom par défaut sera <strong className="text-blue-500">s-utilisateur</strong>.
            </span>
          </div>

          {/* Sécurité Switch */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Verrouiller l'accès
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Protéger vos données par un code PIN
                </span>
              </div>
            </div>

            {/* Custom iOS Toggle Switch */}
            <button
              type="button"
              onClick={() => setPinActive(!pinActive)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-hidden ${
                pinActive ? 'bg-blue-600 dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 transform ${
                  pinActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* PIN Input Field (Collapsible animated) */}
          <AnimatePresence>
            {pinActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Créer votre Code PIN de sécurité
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPin ? 'text' : 'password'}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={pinValue}
                    onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="Entrez 4 chiffres ou plus"
                    maxLength={8}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-10 py-3.5 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-hidden dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center border border-rose-100 dark:border-rose-900/50"
            >
              {error}
            </motion.div>
          )}

          {/* Button Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 text-white font-bold rounded-2xl py-3.5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Démarrer l'application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
