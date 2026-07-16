import { JSX } from 'react';
import { APP_NAME, TAGLINE } from '../constants';

export function SplashScreen(): JSX.Element {
  return (
    <div className="splash">
      <img src="/logo.jpg" alt={`Logo ${APP_NAME}`} />
      <h1>{APP_NAME}</h1>
      <div className="tagline">{TAGLINE}</div>
      <div className="loading">Carregando…</div>
    </div>
  );
}
