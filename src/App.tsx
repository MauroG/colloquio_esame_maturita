import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  LogOut, 
  User, 
  MessageSquare,
  Award, 
  ArrowRight,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import WelcomeScreen from "./components/WelcomeScreen";
import PhaseProgress from "./components/PhaseProgress";
import { Message, PHASES } from "./types";

// Setup speech recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: any = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "it-IT";
}

export default function App() {
  const [studentName, setStudentName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice synthesis states (TTS)
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");
  
  // Voice recognition states (STT)
  const [isListening, setIsListening] = useState(false);
  
  // Final Evaluation state
  const [evaluation, setEvaluation] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Auto-select the best Italian voice
        const it = availableVoices.filter(v => v.lang.toLowerCase().replace("_", "-").startsWith("it"));
        if (it.length > 0) {
          setSelectedVoiceName((prev) => {
            if (prev && it.some(v => v.name === prev)) return prev;
            
            // Priority ordering for smooth natural italian voices
            let bestVoice = it.find(v => v.name.toLowerCase().includes("natural") && v.name.toLowerCase().includes("online"));
            if (!bestVoice) bestVoice = it.find(v => v.name.toLowerCase().includes("natural"));
            if (!bestVoice) bestVoice = it.find(v => v.name.toLowerCase().includes("online"));
            if (!bestVoice) {
              const preferredNames = ["alice", "luca", "paola", "federica", "siri", "google", "elsa", "samuele", "cosimo"];
              for (const pref of preferredNames) {
                const found = it.find(v => v.name.toLowerCase().includes(pref));
                if (found) {
                  bestVoice = found;
                  break;
                }
              }
            }
            if (!bestVoice) bestVoice = it[0];
            return bestVoice.name;
          });
        }
      };
      
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Sync scroll on chat grow
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Convert response text to voice
  const speak = (text: string) => {
    if (!isTtsEnabled || !("speechSynthesis" in window)) return;
    
    // Cancel current speaking contents
    window.speechSynthesis.cancel();

    // Clean text from bracket info like [FASE 1 — APERTURA] to make reading clear
    const textToSpeak = text.replace(/\[FASE\s+\d+[^\]]*\]/gi, "").trim();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "it-IT";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick selected voice or fall back to high priority smooth italian voice
    const itVoices = voices.filter(v => v.lang.toLowerCase().replace("_", "-").startsWith("it"));
    let currentVoice = itVoices.find(v => v.name === selectedVoiceName);

    if (!currentVoice) {
      let bestVoice = itVoices.find(v => v.name.toLowerCase().includes("natural") && v.name.toLowerCase().includes("online"));
      if (!bestVoice) bestVoice = itVoices.find(v => v.name.toLowerCase().includes("natural"));
      if (!bestVoice) bestVoice = itVoices.find(v => v.name.toLowerCase().includes("online"));
      if (!bestVoice) {
        const preferredNames = ["alice", "luca", "paola", "federica", "siri", "google", "elsa", "samuele", "cosimo"];
        for (const pref of preferredNames) {
          const found = itVoices.find(v => v.name.toLowerCase().includes(pref));
          if (found) {
            bestVoice = found;
            break;
          }
        }
      }
      if (!bestVoice) bestVoice = itVoices[0];
      currentVoice = bestVoice;
    }

    if (currentVoice) {
      utterance.voice = currentVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Setup microphones / Web Speech API recognition callbacks
  useEffect(() => {
    if (recognition) {
      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        if (transcript) {
          setInputValue((prev) => {
            const trimmed = prev.trim();
            const trimmedTrans = transcript.trim();
            return trimmed ? `${trimmed} ${trimmedTrans}` : trimmedTrans;
          });
        }
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("Il riconoscimento vocale non è supportato o abilitato sul tuo browser. Ti consigliamo di usare Google Chrome.");
      return;
    }

    // Cancel text speaking to avoid feedback and clean microphone capture
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (err) {
        console.error("Errore durante l'interruzione del riconoscimento:", err);
      }
      setIsListening(false);
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Errore durante l'avvio del riconoscimento:", err);
        // Force reset or stop then start
        try {
          recognition.stop();
          setTimeout(() => {
            try {
              recognition.start();
            } catch (retryErr) {
              console.error("Secondo tentativo fallito:", retryErr);
            }
          }, 300);
        } catch (stopErr) {
          console.error(stopErr);
        }
      }
    }
  };

  // Detect which Phase we are currently in based on Commission answers
  const detectPhaseFromText = (text: string, current: number): number => {
    const uppercaseText = text.toUpperCase();
    if (uppercaseText.includes("FASE 1")) return 1;
    if (uppercaseText.includes("FASE 2")) return 2;
    if (uppercaseText.includes("FASE 3")) return 3;
    if (uppercaseText.includes("FASE 4")) return 4;
    if (uppercaseText.includes("FASE 5")) return 5;
    return current;
  };

  // Start Simulation
  const handleStartSimulation = async (name: string) => {
    setStudentName(name);
    setIsLoading(true);
    setMessages([]);
    setEvaluation(null);
    setCurrentPhase(1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: name,
          currentPhase: 1,
          history: [],
          wantsFeedback: false,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const docMsg: Message = {
          id: "initial_doc",
          role: "commissione",
          text: data.text,
          timestamp: new Date(),
        };
        setMessages([docMsg]);
        speak(data.text);
      } else {
        const errorMsg: Message = {
          id: "error_doc",
          role: "commissione",
          text: data.error || "Incapacità di contattare la commissione d'esame.",
          timestamp: new Date(),
        };
        setMessages([errorMsg]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages([
        {
          id: "error_doc",
          role: "commissione",
          text: "Impossibile caricare il colloquio. Verifica che la connessione sia attiva e di aver configurato la chiave API correttamente.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Answer
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const studentAnswer = inputValue.trim();
    setInputValue("");
    
    // Stop recognition just in case
    if (isListening && recognition) {
      recognition.stop();
    }

    const studentMsg: Message = {
      id: `student_${Date.now()}`,
      role: "candidato",
      text: studentAnswer,
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, studentMsg];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: studentName,
          currentPhase: currentPhase,
          history: updatedHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          wantsFeedback: false,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const nextPhase = detectPhaseFromText(data.text, currentPhase);
        setCurrentPhase(nextPhase);

        const commissionMsg: Message = {
          id: `comm_${Date.now()}`,
          role: "commissione",
          text: data.text,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, commissionMsg]);
        speak(data.text);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `comm_err_${Date.now()}`,
            role: "commissione",
            text: `Errore commissione: ${data.error || "Errore sconosciuto"}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `comm_err_${Date.now()}`,
          role: "commissione",
          text: "Purtroppo si è riscontrato un errore di connessione con il server della commissione.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Qualitative Feedback and End Exam
  const handleRequestFeedback = async () => {
    // Inizia la conclusione d'esame
    setIsLoading(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentName: studentName,
          currentPhase: currentPhase,
          history: messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          wantsFeedback: true,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setEvaluation(data.text);
        speak("La simulazione è terminata. Ecco la valutazione qualitativa finale della commissione.");
      } else {
        alert(data.error || "Errore nel caricamento del feedback.");
      }
    } catch (e) {
      console.error(e);
      alert("Impossibile caricare il feedback finale dovuto a problemi di rete.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setStudentName("");
    setMessages([]);
    setInputValue("");
    setCurrentPhase(1);
    setEvaluation(null);
  };

  // Filter messages to show on chat screen (exclude initial greeting or errors if they need styling)
  const isIntro = messages.length === 0;

  if (!studentName) {
    return <WelcomeScreen onStart={handleStartSimulation} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Top Navigation / Progress Bar */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl font-display">C</div>
          <div>
            <h1 className="text-sm sm:text-base font-bold leading-tight uppercase tracking-tight text-slate-800 font-display">Il Colloquio — Maturità 2026</h1>
            <p className="text-xs font-medium text-slate-500">
              Candidato: <span className="text-indigo-600 font-semibold">{studentName}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Choice of Voice dropdown */}
          {(() => {
            const itVoices = voices.filter(v => v.lang.toLowerCase().replace("_", "-").startsWith("it"));
            if (itVoices.length > 1 && isTtsEnabled) {
              return (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono hidden md:inline">Voce:</span>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => {
                      setSelectedVoiceName(e.target.value);
                      const previewUtterance = new SpeechSynthesisUtterance("Nuova voce selezionata");
                      previewUtterance.lang = "it-IT";
                      const selected = itVoices.find(v => v.name === e.target.value);
                      if (selected) previewUtterance.voice = selected;
                      window.speechSynthesis.cancel();
                      window.speechSynthesis.speak(previewUtterance);
                    }}
                    className="text-[11px] font-bold text-slate-600 bg-transparent border-none outline-none max-w-[100px] sm:max-w-[140px] truncate cursor-pointer"
                    title="Seleziona la Voce del Presidente d'Esame"
                  >
                    {itVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name.replace(/Google/gi, "Google").replace(/Microsoft/gi, "MS").replace(/Italian\s*\(Italy\)/gi, "IT").replace(/Italiano/gi, "IT").replace(/Desktop/gi, "").trim()}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })()}

          {/* Audio read-aloud toggle */}
          <button
            onClick={() => {
              const toggled = !isTtsEnabled;
              setIsTtsEnabled(toggled);
              if (!toggled && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            title={isTtsEnabled ? "Silenzia lettura vocale" : "Attiva lettura vocale"}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isTtsEnabled 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" 
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            {isTtsEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wide transition-colors cursor-pointer"
          >
            Nuovo Colloquio
          </button>
        </div>
      </header>

      {/* Main Interview Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        {/* Sidebar Info */}
        <aside className="w-full md:w-80 bg-white md:border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 border-b md:border-b-0">
          <div>
            <h2 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3">Fase Corrente</h2>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <span className="text-indigo-700 font-bold text-sm block">FASE {currentPhase} di 5</span>
              <span className="text-indigo-950 font-black text-lg block leading-tight font-display">{PHASES[currentPhase]?.title.toUpperCase()}</span>
              <p className="text-indigo-600/70 text-[11px] mt-2 leading-relaxed font-medium">{PHASES[currentPhase]?.description}</p>
            </div>
          </div>

          <div className="hidden md:block">
            <PhaseProgress currentPhase={currentPhase} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sotto-Commissione 5AT</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-sm shadow-2xs">🏛️</div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Presidente Esterno</div>
                  <div className="text-[10px] text-slate-500 font-medium font-mono">O.M. 54/2026</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-sm shadow-2xs">📚</div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Comm. Umanistico</div>
                  <div className="text-[10px] text-slate-500 font-medium">Interno (Italiano/Storia)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-sm shadow-2xs">⚡</div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Comm. Tecnologico</div>
                  <div className="text-[10px] text-slate-500 font-medium">Interno (TPSEE/Elettronica)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
             {currentPhase >= 3 ? (
               <button
                 onClick={handleRequestFeedback}
                 disabled={isLoading}
                 className="w-full py-3 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
               >
                 <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shrink-0"></span>
                 <span className="tracking-wide">TERMINA E RICEVI FEEDBACK</span>
               </button>
             ) : (
               <div className="text-[11px] text-slate-400 text-center italic">
                 Il pulsante di feedback finale si sbloccherà al raggiungimento della Fase 3 (PCTO).
               </div>
             )}
          </div>
        </aside>

        {/* Chat History and Input section */}
        <section className="flex-1 flex flex-col bg-slate-50 relative min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {!evaluation ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Conversations box */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
                  {messages.map((msg) => {
                    const isCommission = msg.role === "commissione";
                    
                    // Filter bracket tags from text
                    const displayMsg = msg.text.replace(/\[FASE\s+\d+[^\]]*\]/gi, "").trim();
                    const phaseTitleMatch = msg.text.match(/\[(FASE\s+\d+[^\]]*)\]/i);
                    const phaseTag = phaseTitleMatch ? phaseTitleMatch[1] : null;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-4 ${isCommission ? "" : "flex-row-reverse"}`}
                      >
                        {/* Speaker Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border text-sm ${
                          isCommission 
                            ? "bg-white border-slate-200" 
                            : "bg-indigo-600 border-indigo-600 text-white font-bold"
                        }`}>
                          {isCommission ? "🎓" : studentName.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Text bubble */}
                        <div className={`max-w-[85%] sm:max-w-xl md:max-w-2xl p-5 rounded-2xl shadow-sm border ${
                          isCommission
                            ? "bg-white border-slate-200 rounded-tl-none text-slate-800"
                            : "bg-indigo-600 border-indigo-600 text-white rounded-tr-none"
                        }`}>
                          <span className={`text-[10px] font-bold uppercase mb-2 block tracking-wider font-mono ${
                            isCommission ? "text-indigo-600" : "text-indigo-200"
                          }`}>
                            {isCommission 
                              ? `Commissione — ${phaseTag || `[FASE ${currentPhase}]`}` 
                              : `Candidato — ${studentName}`}
                          </span>
                          
                          <p className={`leading-relaxed text-sm md:text-[14.5px] ${
                            isCommission ? "text-slate-800" : "text-white"
                          }`}>{displayMsg}</p>

                          <span className={`text-[9px] block mt-2 text-right font-mono ${
                            isCommission ? "text-slate-400" : "text-indigo-100"
                          }`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">🎓</div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-5 max-w-xs shadow-xs flex items-center space-x-2">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                        <span className="text-xs text-slate-400 font-bold pl-1 uppercase tracking-wider font-mono">In stesura...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input form */}
                <footer className="bg-white border-t border-slate-200 p-4 sm:p-6 flex flex-col gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <form onSubmit={handleSendMessage} className="flex-1 relative flex items-center gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={isListening ? "Parla ora, sto ascoltando la tua voce..." : "Rispondi alla commissione..."}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-6 pr-14 py-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                          disabled={isLoading}
                        />

                        {/* Fast action send inside field */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                          <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center shadow-sm transition-all transform active:scale-95 cursor-pointer"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Microfono STT */}
                      <button
                        type="button"
                        onClick={toggleListening}
                         className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer shadow-sm ${
                          isListening
                            ? "bg-red-500 hover:bg-red-600 border-red-500 text-white animate-pulse"
                            : "bg-red-50 hover:bg-red-100 border-red-100 text-red-500"
                        }`}
                        title={isListening ? "Smetti di registrare" : "Parla con il microfono"}
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                    </form>
                  </div>

                  {/* Caption notes and specifications */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
                    <p className="text-[10px] text-slate-400 font-medium">
                      * Modalità vocale disponibile su Google Chrome (Web Speech API)
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span>AI: GEMINI-3.5-FLASH</span>
                    </div>
                  </div>
                </footer>
              </div>
            ) : (
              // Quality assessment final report
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
              >
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
                  <div className="bg-amber-50 p-3 rounded-full text-amber-600 border border-amber-100">
                    <Award className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-display">Valutazione Qualitativa Finale</h2>
                    <p className="text-xs text-slate-500 font-bold font-mono uppercase tracking-wide">
                      O.M. N. 54 del 26 Marzo 2026 — Sessione Conclusa
                    </p>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-slate-700 text-[14.5px] leading-relaxed">
                  <div className="whitespace-pre-wrap bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm leading-relaxed">
                    {evaluation}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={handleReset}
                    className="flex-1 inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3.5 px-4 shadow-sm transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-4.5 w-4.5" />
                    <span>Inizia una Nuova Simulazione</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
                  >
                    Stampa Resoconto d'Esame
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Bottom Footer Line */}
      <footer className="h-7 bg-slate-800 flex items-center px-4 md:px-8 justify-between shrink-0 text-slate-400 select-none z-50">
        <span className="text-[10px] tracking-wider font-mono">O.M. N. 54 DEL 26 MARZO 2026 — COLLOQUIO MATURITÀ</span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-red-500 hidden sm:inline">NON INSERIRE INFORMAZIONI SENSIBILI</span>
      </footer>
    </div>
  );
}
