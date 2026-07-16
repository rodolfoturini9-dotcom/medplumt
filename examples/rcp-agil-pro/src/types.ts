export type RhythmCode = 'FV' | 'TV' | 'AESP' | 'ASSISTOLIA' | 'PERFUNDIVEL';

export type EntryType =
  | 'inicio'
  | 'ritmo'
  | 'choque'
  | 'medicacao'
  | 'compressoes'
  | 'pausa'
  | 'ventilacao'
  | 'intervencao'
  | 'sinais-vitais'
  | 'complicacao'
  | 'rce'
  | 'interrupcao'
  | 'ecmo'
  | 'nota';

export interface LogEntry {
  id: string;
  type: EntryType;
  /** Timestamp absoluto (epoch ms) */
  at: number;
  /** Descrição legível do evento */
  label: string;
  /** Quem executou/registrou a ação */
  performer?: string;
  /** Dados estruturados específicos do tipo (dose, via, energia, ritmo, etc.) */
  data?: Record<string, string | number | boolean>;
}

export interface AuditEntry {
  at: number;
  who: string;
  what: string;
}

export interface Patient {
  name: string;
  recordId: string;
  birthDate?: string;
  age?: string;
  sex?: string;
  allergies?: string;
  comorbidities?: string;
  medications?: string;
}

export interface TeamMember {
  role: string;
  name: string;
}

export type Outcome = 'RCE' | 'OBITO' | 'ECMO';

export interface CprEvent {
  id: string;
  createdAt: number;
  startedAt: number;
  endedAt?: number;
  hospital: string;
  location: string;
  presumedCause: string;
  witnessed: boolean;
  collapseToStartMin?: string;
  patient: Patient;
  team: TeamMember[];
  entries: LogEntry[];
  outcome?: Outcome;
  outcomeDetail?: string;
  /** Campos narrativos editáveis após encerramento */
  narrative: string;
  clinicalContext: string;
  prognosis: string;
  nextActions: string;
  complicationsNote: string;
  qualityNote: string;
  signedBy?: string;
  signedCrm?: string;
  signedSpecialty?: string;
  signedAt?: number;
  audit: AuditEntry[];
}

export interface RhythmInfo {
  code: RhythmCode;
  name: string;
  shockable: boolean;
  perfusing: boolean;
}

export interface MedicationOption {
  name: string;
  /** Dose padrão sugerida */
  defaultDose: string;
  defaultRoute: string;
  /** Faixa aceita com aviso (fora dela exige confirmação) */
  minDose?: number;
  maxDose?: number;
  unit?: string;
  /** Intervalo mínimo/máximo recomendado entre doses (minutos) */
  minIntervalMin?: number;
  maxIntervalMin?: number;
  note?: string;
}
