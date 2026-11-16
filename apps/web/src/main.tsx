import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyTheme } from '@moody/theme';
import { App } from '@/app/App';
import '@/app/styles/global.css';

// Tokens viram CSS variables ANTES do primeiro render.
applyTheme();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Elemento #root não encontrado em index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
