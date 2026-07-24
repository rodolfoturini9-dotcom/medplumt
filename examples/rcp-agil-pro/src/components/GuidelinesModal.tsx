import { JSX, useMemo, useState } from 'react';
import { GUIDELINES } from '../constants';

/** Diretrizes ACLS disponíveis offline, com busca por palavra-chave */
export function GuidelinesModal(props: { onClose: () => void }): JSX.Element {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    if (!q.trim()) {
      return GUIDELINES;
    }
    return GUIDELINES.filter((g) => {
      const haystack = (g.title + ' ' + g.keywords + ' ' + g.lines.join(' '))
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [query]);

  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <h2>Diretrizes ACLS (offline)</h2>
        <div className="field">
          <input
            placeholder="Buscar por palavra-chave: dose, FV, interrupção, 5H…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        {filtered.length === 0 && <p style={{ color: 'var(--gray)' }}>Nenhum tópico encontrado.</p>}
        {filtered.map((g) => (
          <div className="guideline" key={g.title}>
            <h4>{g.title}</h4>
            <ul>
              {g.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="row">
          <button className="btn btn-gold" onClick={props.onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
