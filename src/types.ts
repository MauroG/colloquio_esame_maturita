export interface Message {
  id: string;
  role: "commissione" | "candidato";
  text: string;
  timestamp: Date;
}

export interface PhaseInfo {
  number: number;
  title: string;
  subtitle: string;
  description: string;
}

export const PHASES: Record<number, PhaseInfo> = {
  1: {
    number: 1,
    title: "Apertura & Curriculum",
    subtitle: "Presentazione e crescita personale",
    description: "Riflessione sul percorso scolastico, Curriculum dello studente e maturità raggiunta."
  },
  2: {
    number: 2,
    title: "Le Quattro Discipline",
    subtitle: "Domande interdisciplinari",
    description: "Verifica di Italiano, Inglese, TPSEE ed Elettrotecnica ed Elettronica, calibrate sui programmi."
  },
  3: {
    number: 3,
    title: "Esperienza PCTO",
    subtitle: "Formazione scuola-lavoro",
    description: "Esposizione e riflessioni critiche collegate alle materie d'esame."
  },
  4: {
    number: 4,
    title: "Educazione Civica",
    subtitle: "Cittadinanza attiva e tecnologia",
    description: "Analisi delle tematiche civiche, etiche e ambientali affrontate."
  },
  5: {
    number: 5,
    title: "Discussione Prove Scritte",
    subtitle: "Riflessione sugli elaborati",
    description: "Commento e chiarimento sui compiti della prima e seconda prova d'esame."
  }
};
