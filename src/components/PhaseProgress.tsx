import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { PHASES } from "../types";

interface PhaseProgressProps {
  currentPhase: number;
}

export default function PhaseProgress({ currentPhase }: PhaseProgressProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Struttura Ordinanza Ministeriale n. 54/2026
        </h3>
        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
          FASE {currentPhase} di 5 — {PHASES[currentPhase]?.title.toUpperCase()}
        </span>
      </div>

      {/* Stepper tracker */}
      <div className="grid grid-cols-5 gap-2 relative">
        {Object.values(PHASES).map((phase) => {
          const isCompleted = phase.number < currentPhase;
          const isActive = phase.number === currentPhase;

          return (
            <div
              key={phase.number}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition ${
                isActive
                  ? "bg-indigo-50/70 border border-indigo-200"
                  : isCompleted
                  ? "bg-slate-50/50"
                  : "bg-transparent"
              }`}
            >
              <div className="mb-1.5">
                {isCompleted ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                ) : isActive ? (
                  <Circle className="h-4.5 w-4.5 text-indigo-600 fill-indigo-100 animate-pulse animate-duration-1000" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-slate-300" />
                )}
              </div>
              <span
                className={`text-[10px] md:text-xs font-bold ${
                  isActive ? "text-indigo-700" : isCompleted ? "text-slate-600" : "text-slate-400"
                }`}
              >
                Fase {phase.number}
              </span>
              <span className="hidden md:block text-[9px] text-slate-500 mt-0.5 truncate max-w-full">
                {phase.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current phase guidance subtitle */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-bold text-slate-800">In corso: </span>
          <span className="text-slate-600">{PHASES[currentPhase]?.description}</span>
        </div>
        <div className="text-slate-400 italic text-[11px] shrink-0">
          Durata indicativa: {currentPhase === 2 ? "20" : "5"} min
        </div>
      </div>
    </div>
  );
}
