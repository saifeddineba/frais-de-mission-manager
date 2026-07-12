/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Fingerprint, Delete, AlertCircle } from 'lucide-react';

interface SecurityScreenProps {
  storedPin: string;
  isBiometricActive: boolean;
  onUnlocked: () => void;
}

export default function SecurityScreen({ storedPin, isBiometricActive, onUnlocked }: SecurityScreenProps) {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    setError(null);
    if (enteredPin.length < 8) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);
      
      // Auto submit if length matches stored PIN
      if (newPin === storedPin) {
        setTimeout(() => {
          onUnlocked();
        }, 200);
      } else if (newPin.length >= storedPin.length && storedPin.length >= 4) {
        // If wrong PIN entered
        setTimeout(() => {
          setError('Code PIN incorrect');
          setEnteredPin('');
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setError(null);
    setEnteredPin(enteredPin.slice(0, -1));
  };

  const triggerBiometricSimulation = () => {
    if (!isBiometricActive) return;
    
    // Simulate biometric check
    onUnlocked();
  };

  return (
    <div className="fixed inset-0 bg-[#111318] text-[#E2E2E9] flex flex-col items-center justify-between p-6 z-50">
      {/* Top Banner */}
      <div className="flex flex-col items-center mt-12 text-center animate-fade-in">
        <div className="bg-[#005AC1]/10 p-4 rounded-2xl mb-4 border border-[#005AC1]/20">
          <Shield className="w-12 h-12 text-[#D3E4FF]" id="security-icon" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">S-Mission Manager</h1>
        <p className="text-slate-400 text-sm mt-2 font-medium">Application sécurisée</p>
      </div>

      {/* PIN Dots */}
      <div className="flex flex-col items-center w-full max-w-xs animate-fade-in">
        <div className="text-slate-300 mb-6 text-sm">
          {isBiometricActive ? "Entrez votre code PIN ou utilisez l'empreinte" : "Entrez votre code PIN pour déverrouiller"}
        </div>
        
        <div className="flex justify-center gap-4 mb-4">
          {[...Array(Math.max(4, storedPin.length))].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < enteredPin.length
                  ? 'bg-[#D3E4FF] border-[#D3E4FF] scale-110 shadow-[0_0_12px_rgba(211,228,255,0.6)]'
                  : 'border-slate-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-400 text-sm animate-pulse mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs mb-12 animate-fade-in">
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 active:bg-slate-600 font-bold text-xl text-white transition-all flex items-center justify-center border border-slate-700/40 cursor-pointer"
              id={`keypad-${num}`}
            >
              {num}
            </button>
          ))}
          
          {/* Left action button (Biometrics) */}
          {isBiometricActive ? (
            <button
              onClick={triggerBiometricSimulation}
              className="h-16 rounded-2xl bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 flex items-center justify-center border border-emerald-500/20 transition-all cursor-pointer"
              title="Empreinte digitale"
              id="keypad-biometric"
            >
              <Fingerprint className="w-8 h-8" />
            </button>
          ) : (
            <div className="h-16" />
          )}

          {/* Zero */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 active:bg-slate-600 font-bold text-xl text-white transition-all flex items-center justify-center border border-slate-700/40 cursor-pointer"
            id="keypad-0"
          >
            0
          </button>

          {/* Delete */}
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 flex items-center justify-center border border-slate-700/40 transition-all cursor-pointer"
            title="Effacer"
            id="keypad-delete"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
        
        {isBiometricActive && (
          <div className="text-center mt-6">
            <button
              onClick={triggerBiometricSimulation}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 px-5 py-2.5 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
              id="simulate-biometrics-btn"
            >
              Simuler l'authentification biométrique
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
