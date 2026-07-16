import { JSX, useState } from 'react';
import { PRESUMED_CAUSES, TEAM_ROLES } from '../constants';
import { CprEvent, TeamMember } from '../types';
import { newId } from '../utils';

export interface NewEventFormProps {
  onCancel: () => void;
  onStart: (event: CprEvent) => void;
}

export function NewEventForm(props: NewEventFormProps): JSX.Element {
  const [name, setName] = useState('');
  const [recordId, setRecordId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [allergies, setAllergies] = useState('');
  const [comorbidities, setComorbidities] = useState('');
  const [medications, setMedications] = useState('');
  const [hospital, setHospital] = useState('');
  const [location, setLocation] = useState('');
  const [cause, setCause] = useState(PRESUMED_CAUSES[0]);
  const [witnessed, setWitnessed] = useState(true);
  const [collapseMin, setCollapseMin] = useState('');
  const [team, setTeam] = useState<TeamMember[]>(TEAM_ROLES.map((role) => ({ role, name: '' })));
  const [error, setError] = useState('');

  function setTeamName(role: string, value: string): void {
    setTeam((prev) => prev.map((m) => (m.role === role ? { ...m, name: value } : m)));
  }

  function handleStart(): void {
    // Validação de integridade: campos mínimos para iniciar
    if (!name.trim() && !recordId.trim()) {
      setError('Informe ao menos o nome ou o número de prontuário do paciente.');
      return;
    }
    const now = Date.now();
    const event: CprEvent = {
      id: newId(),
      createdAt: now,
      startedAt: now,
      hospital: hospital.trim(),
      location: location.trim(),
      presumedCause: cause,
      witnessed,
      collapseToStartMin: collapseMin.trim(),
      patient: {
        name: name.trim(),
        recordId: recordId.trim(),
        birthDate,
        age: age.trim(),
        sex,
        allergies: allergies.trim(),
        comorbidities: comorbidities.trim(),
        medications: medications.trim(),
      },
      team: team.filter((m) => m.name.trim()),
      entries: [],
      narrative: '',
      clinicalContext: '',
      prognosis: '',
      nextActions: '',
      complicationsNote: '',
      qualityNote: '',
      audit: [],
    };
    props.onStart(event);
  }

  return (
    <div>
      <h2 className="section-title">Novo Evento RCP</h2>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Dados do Paciente</h3>
        <div className="form-grid">
          <div className="field">
            <label>Nome do paciente</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" autoFocus />
          </div>
          <div className="field">
            <label>Número de prontuário / ID</label>
            <input value={recordId} onChange={(e) => setRecordId(e.target.value)} placeholder="Ex: 12345" />
          </div>
          <div className="field">
            <label>Data de nascimento</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Idade</label>
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex: 65" />
          </div>
          <div className="field">
            <label>Sexo</label>
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">—</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div className="field">
            <label>Alergias</label>
            <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Ou deixe em branco" />
          </div>
          <div className="field">
            <label>Comorbidades</label>
            <input value={comorbidities} onChange={(e) => setComorbidities(e.target.value)} />
          </div>
          <div className="field">
            <label>Medicações em uso</label>
            <input value={medications} onChange={(e) => setMedications(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Dados do Evento</h3>
        <div className="form-grid">
          <div className="field">
            <label>Hospital</label>
            <input value={hospital} onChange={(e) => setHospital(e.target.value)} />
          </div>
          <div className="field">
            <label>Local / Unidade</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: UTI, Enfermaria 3" />
          </div>
          <div className="field">
            <label>Causa presumida</label>
            <select value={cause} onChange={(e) => setCause(e.target.value)}>
              {PRESUMED_CAUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tempo de colapso até RCP (min)</label>
            <input value={collapseMin} onChange={(e) => setCollapseMin(e.target.value)} placeholder="Ex: 2" />
          </div>
          <div className="field">
            <label>Colapso testemunhado?</label>
            <select value={witnessed ? 'S' : 'N'} onChange={(e) => setWitnessed(e.target.value === 'S')}>
              <option value="S">Sim</option>
              <option value="N">Não</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3>Equipe Presente</h3>
        <div className="form-grid">
          {team.map((m) => (
            <div className="field" key={m.role}>
              <label>{m.role}</label>
              <input value={m.name} onChange={(e) => setTeamName(m.role, e.target.value)} placeholder="Nome" />
            </div>
          ))}
        </div>
      </div>

      {error && <div className="danger-box">{error}</div>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn btn-red" style={{ flex: 2, fontSize: 20 }} onClick={handleStart}>
          INICIAR RCP AGORA
        </button>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={props.onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
