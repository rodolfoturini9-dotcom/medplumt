import { MedicationOption, RhythmCode, RhythmInfo } from './types';

export const APP_NAME = 'RCP ÁGIL PRO';
export const TAGLINE = 'Decisões Rápidas. Mais Vidas Salvas.';

export const RHYTHMS: RhythmInfo[] = [
  { code: 'FV', name: 'Fibrilação Ventricular', shockable: true, perfusing: false },
  { code: 'TV', name: 'Taquicardia Ventricular sem pulso', shockable: true, perfusing: false },
  { code: 'AESP', name: 'Atividade Elétrica Sem Pulso', shockable: false, perfusing: false },
  { code: 'ASSISTOLIA', name: 'Assistolia', shockable: false, perfusing: false },
  { code: 'PERFUNDIVEL', name: 'Ritmo Organizado / Perfundível', shockable: false, perfusing: true },
];

export function getRhythm(code: RhythmCode): RhythmInfo {
  return RHYTHMS.find((r) => r.code === code) as RhythmInfo;
}

export const MEDICATIONS: MedicationOption[] = [
  {
    name: 'Adrenalina',
    defaultDose: '1',
    defaultRoute: 'IV',
    minDose: 0.5,
    maxDose: 2,
    unit: 'mg',
    minIntervalMin: 2,
    maxIntervalMin: 6,
    note: '1 mg IV a cada 3-5 minutos',
  },
  {
    name: 'Amiodarona',
    defaultDose: '300',
    defaultRoute: 'IV',
    minDose: 150,
    maxDose: 360,
    unit: 'mg',
    note: '300 mg IV após 3º choque; 2ª dose 150 mg',
  },
  {
    name: 'Atropina',
    defaultDose: '0.5',
    defaultRoute: 'IV',
    minDose: 0.5,
    maxDose: 1,
    unit: 'mg',
    note: '0,5-1 mg (máximo 3 mg total)',
  },
  {
    name: 'Lidocaína',
    defaultDose: '100',
    defaultRoute: 'IV',
    minDose: 50,
    maxDose: 150,
    unit: 'mg',
    note: '1-1,5 mg/kg IV',
  },
  {
    name: 'Sulfato de Magnésio',
    defaultDose: '2',
    defaultRoute: 'IV',
    minDose: 1,
    maxDose: 2,
    unit: 'g',
    note: '1-2 g IV (torsades de pointes)',
  },
  {
    name: 'Bicarbonato de Sódio',
    defaultDose: '50',
    defaultRoute: 'IV',
    unit: 'mEq',
    note: '1 mEq/kg (acidose, hipercalemia)',
  },
  { name: 'Outra', defaultDose: '', defaultRoute: 'IV' },
];

export const ATROPINE_MAX_TOTAL_MG = 3;

export const DEFIB_ENERGIES = [120, 150, 200, 300, 360];

export const TEAM_ROLES = [
  'Coordenador',
  'Compressor 1',
  'Compressor 2',
  'Ventilador',
  'Medicador',
  'Desfibrilador',
  'Registrador',
];

export const PRESUMED_CAUSES = [
  'Infarto Agudo do Miocárdio',
  'Sepse',
  'Trauma',
  'Hipóxia',
  'Tromboembolismo Pulmonar',
  'Distúrbio Hidroeletrolítico',
  'Intoxicação',
  'Desconhecida',
  'Outra',
];

/** Intervalos do protocolo (ms) */
export const RHYTHM_CHECK_INTERVAL_MS = 2 * 60 * 1000;
export const ADRENALINE_INTERVAL_MS = 3 * 60 * 1000;
export const ADRENALINE_MIN_INTERVAL_MS = 2 * 60 * 1000;
export const ADRENALINE_MAX_INTERVAL_MS = 6 * 60 * 1000;
export const NO_ROSC_LIMIT_MS = 30 * 60 * 1000;
export const COMPRESSION_PAUSE_LIMIT_MS = 10 * 1000;

export const METRONOME_MIN_BPM = 100;
export const METRONOME_MAX_BPM = 120;
export const METRONOME_DEFAULT_BPM = 110;

export interface GuidelineTopic {
  title: string;
  keywords: string;
  lines: string[];
}

export const GUIDELINES: GuidelineTopic[] = [
  {
    title: 'Algoritmo ACLS — Ritmos Chocáveis (FV / TV sem pulso)',
    keywords: 'fv tv fibrilacao taquicardia choque desfibrilacao chocavel algoritmo',
    lines: [
      '1. Iniciar RCP de alta qualidade (100-120 compressões/min, 5-6 cm).',
      '2. Desfibrilar assim que disponível (bifásico 120-200 J; monofásico 360 J).',
      '3. RCP por 2 minutos → verificar ritmo.',
      '4. Persistindo FV/TV: 2º choque → RCP 2 min → Adrenalina 1 mg IV.',
      '5. Persistindo: 3º choque → RCP 2 min → Amiodarona 300 mg IV.',
      '6. Adrenalina 1 mg IV a cada 3-5 minutos.',
      '7. 2ª dose de Amiodarona: 150 mg IV.',
      '8. Tratar causas reversíveis (5H e 5T).',
    ],
  },
  {
    title: 'Algoritmo ACLS — Ritmos Não Chocáveis (AESP / Assistolia)',
    keywords: 'aesp assistolia nao chocavel algoritmo atividade eletrica',
    lines: [
      '1. Iniciar RCP de alta qualidade imediatamente.',
      '2. Adrenalina 1 mg IV o mais cedo possível; repetir a cada 3-5 min.',
      '3. RCP por 2 minutos → verificar ritmo.',
      '4. Desfibrilação NÃO indicada.',
      '5. Buscar e tratar causas reversíveis (5H e 5T).',
      '6. Considerar via aérea avançada e capnografia.',
    ],
  },
  {
    title: 'Causas Reversíveis — 5H e 5T',
    keywords: '5h 5t causas reversiveis hipoxia hipovolemia tamponamento trombose pneumotorax',
    lines: [
      'Hipovolemia · Hipóxia · Hidrogênio (acidose) · Hipo/Hipercalemia · Hipotermia',
      'Tensão no tórax (pneumotórax hipertensivo) · Tamponamento cardíaco',
      'Toxinas · Trombose pulmonar (TEP) · Trombose coronariana (IAM)',
    ],
  },
  {
    title: 'Doses de Medicações',
    keywords: 'dose medicacao adrenalina amiodarona atropina lidocaina magnesio bicarbonato',
    lines: [
      'Adrenalina: 1 mg IV/IO a cada 3-5 min.',
      'Amiodarona: 300 mg IV após 3º choque; 2ª dose 150 mg.',
      'Lidocaína (alternativa): 1-1,5 mg/kg; depois 0,5-0,75 mg/kg.',
      'Sulfato de Magnésio: 1-2 g IV (torsades de pointes).',
      'Atropina: 0,5-1 mg (bradicardia; máx. 3 mg total).',
      'Bicarbonato de Sódio: 1 mEq/kg (acidose grave, hipercalemia).',
    ],
  },
  {
    title: 'Qualidade de RCP',
    keywords: 'qualidade compressao profundidade frequencia ventilacao capnografia',
    lines: [
      'Frequência de compressão: 100-120/min.',
      'Profundidade: 5-6 cm, com retorno torácico completo.',
      'Minimizar interrupções (pausas < 10 segundos).',
      'Trocar compressor a cada 2 minutos.',
      'Ventilação: 10-12/min com via aérea avançada; evitar hiperventilação.',
      'ETCO₂ < 10 mmHg após 20 min: mau prognóstico; ETCO₂ ≥ 40: possível RCE.',
    ],
  },
  {
    title: 'Critérios de Interrupção de RCP',
    keywords: 'interrupcao interromper obito criterios parar 30 minutos',
    lines: [
      'Considerar após 30 minutos de RCP sem RCE (ACLS 2020).',
      'Assistolia persistente refratária a manobras adequadas.',
      'Causa irreversível identificada.',
      'Exceções: hipotermia, intoxicação, TEP em trombólise — prolongar esforços.',
      'Decisão registrada com responsável, horário e motivo.',
    ],
  },
  {
    title: 'Cuidados Pós-RCE',
    keywords: 'rce pos parada hipotermia cateterismo cuidados retorno circulacao',
    lines: [
      'Otimizar ventilação/oxigenação (SpO₂ 92-98%; evitar hiperóxia).',
      'PAS ≥ 90 mmHg / PAM ≥ 65 mmHg (volume, vasopressores).',
      'ECG 12 derivações; considerar cateterismo se IAM.',
      'Controle direcionado de temperatura (32-36 °C por ≥ 24 h).',
      'Avaliação neurológica seriada; EEG se suspeita de convulsão.',
    ],
  },
];
