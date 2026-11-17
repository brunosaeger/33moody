import { useRef, useState, type FormEvent } from 'react';
import { useClock } from '@/data';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/icons';
import { validateRange } from './rangeInput';
import { useDataBounds } from './useDataBounds';
import { formatDateBR, parseLocalDateTime, toDateInput, toTimeInput } from '@/shared/lib/timeFormat';
import styles from './RangePicker.module.css';

/** Sugestão inicial: os últimos 10 minutos (o técnico só ajusta e confirma). */
const SUGGESTED_SPAN_MS = 10 * 60 * 1000;

/**
 * Calendário + hora inicial + hora final. Confirmar (botão ou Enter) entra
 * no modo replay com essa faixa. Numa gravação, começa com o arquivo inteiro.
 */
export function RangePicker() {
  const startReplay = useClock((s) => s.startReplay);
  const getBounds = useDataBounds();
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Sugestão inicial: a gravação inteira, ou os últimos 10 minutos ao vivo.
  const [initial] = useState(() => {
    const b = getBounds();
    return b.recorded ? b : { startMs: b.endMs - SUGGESTED_SPAN_MS, endMs: b.endMs };
  });
  const [date, setDate] = useState(() => toDateInput(initial.startMs));
  const [start, setStart] = useState(() => toTimeInput(initial.startMs));
  const [end, setEnd] = useState(() => toTimeInput(initial.endMs));
  const [error, setError] = useState<string | null>(null);

  const openCalendar = () => {
    const input = dateInputRef.current;
    if (!input) return;
    // showPicker abre o calendário nativo; navegadores antigos só recebem foco.
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateRange(date, start, end, getBounds());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    startReplay(result.range);
  };

  const dateMs = parseLocalDateTime(date, '00:00');

  return (
    <form className={styles.picker} onSubmit={onSubmit}>
      <button type="button" className={styles.calendar} onClick={openCalendar} title="Escolher a data">
        <Icon name="calendar" size={15} />
        <span>{dateMs !== null ? formatDateBR(dateMs) : '—'}</span>
        <input
          ref={dateInputRef}
          className={styles.hiddenDate}
          type="date"
          value={date}
          max={toDateInput(initial.endMs)}
          tabIndex={-1}
          aria-label="Data da faixa"
          onChange={(e) => setDate(e.target.value)}
        />
      </button>

      <input
        className={styles.time}
        type="time"
        step={1}
        value={start}
        aria-label="Início da faixa"
        onChange={(e) => setStart(e.target.value)}
      />
      <span className={styles.arrow}>→</span>
      <input
        className={styles.time}
        type="time"
        step={1}
        value={end}
        aria-label="Fim da faixa"
        onChange={(e) => setEnd(e.target.value)}
      />

      <Button type="submit" variant="primary" size="sm">
        Ver replay
      </Button>

      {error && <span className={styles.error}>{error}</span>}
    </form>
  );
}
