import React, { useState } from "react";
import { GraduationCap, ArrowRight, BookOpen, Clock, Activity, FileCheck } from "lucide-react";
import { motion } from "motion/react";

interface WelcomeScreenProps {
  onStart: (name: string) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Margin/Decoration */}
      <div className="w-full max-w-4xl mx-auto flex justify-between items-center py-4 border-b border-slate-200">
        <div className="flex items-center gap-3 text-slate-800 font-bold tracking-tight">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg font-display">C</div>
          <span className="font-display uppercase text-xs sm:text-sm tracking-wider">Il Colloquio — Maturità 2026</span>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
          Classe 5AT — Automazione
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-4xl mx-auto my-auto py-10 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="w-full lg:w-1/2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <span className="text-xs uppercase tracking-widest font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded">
              NON INSERIRE INFORMAZIONI SENSIBILI
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Il Colloquio <br />
              <span className="text-indigo-700">Maturità 2026</span>
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Simulatore del colloquio orale
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-4 text-sm text-slate-600"
          >
            <p>
              Questo applicativo simula in tempo reale l'esame orale in cinque fasi per gli allievi della classe 
              <strong> 5AT - Articolazione Automazione</strong>, calibrando l'interazione sul <strong>Documento del 15 maggio</strong>.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
                <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">4 Materie Estratte</span>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
                <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">5 Fasi O.M. 54</span>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
                <Activity className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Modalità Vocale</span>
              </div>
              <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
                <FileCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Feedback Qualitativo</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Input Form Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full lg:w-96 bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-md space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Registrazione Candidato</h2>
            <p className="text-xs text-slate-500">Inserisci i dati per avviare la sessione d'esame</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="student-name" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Il tuo nome
              </label>
              <input
                id="student-name"
                type="text"
                required
                placeholder="es. Mario"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            <button
              id="start-button"
              type="submit"
              disabled={!name.trim()}
              className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white font-semibold py-3 px-4 shadow-sm transition cursor-pointer"
            >
              <span>Inizia il colloquio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              La simulazione comprende Lingua e letteratura italiana, Lingua inglese, TPSEE, ed Elettrotecnica ed elettronica.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-4xl mx-auto py-6 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-750">
          Questa simulazione segue la struttura del colloquio orale prevista dall'O.M. n. 54 del 26 marzo 2026
        </p>
        <p>Autore di IL COLLOQUIO: prof. Gardenal Mauro — a.s. 2025/2026</p>
      </div>
    </div>
  );
}
