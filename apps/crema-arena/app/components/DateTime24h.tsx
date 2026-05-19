'use client';

/**
 * Locale-independent 24h date+time picker. Browsers render
 * `<input type="datetime-local">` time field in OS locale, which means en-US
 * users see AM/PM. Splitting into <input type="date"> (locale-independent
 * ISO YYYY-MM-DD) plus two 24h <select>s gives us a stable 24h experience.
 *
 * Value is the same `YYYY-MM-DDTHH:MM` string the previous datetime-local
 * input emitted, so consumers don't need to change.
 */

interface DateTime24hProps {
  label: string;
  value: string; // 'YYYY-MM-DDTHH:MM' or '' (empty)
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function split(value: string): { date: string; hour: string; minute: string } {
  if (!value) return { date: '', hour: '20', minute: '00' };
  const [date = '', time = '20:00'] = value.split('T');
  const [hour = '20', minute = '00'] = time.split(':');
  // Snap minute to nearest 15 so the select can represent it.
  const snapped =
    MINUTES.includes(minute) ? minute : MINUTES.reduce((a, b) =>
      Math.abs(parseInt(b) - parseInt(minute)) < Math.abs(parseInt(a) - parseInt(minute)) ? b : a
    );
  return { date, hour: hour.padStart(2, '0'), minute: snapped };
}

function join(date: string, hour: string, minute: string): string {
  if (!date) return '';
  return `${date}T${hour}:${minute}`;
}

export default function DateTime24h({
  label,
  value,
  onChange,
  error,
  required,
}: DateTime24hProps) {
  const { date, hour, minute } = split(value);

  const update = (next: { date?: string; hour?: string; minute?: string }) => {
    const d = next.date ?? date;
    const h = next.hour ?? hour;
    const m = next.minute ?? minute;
    onChange(join(d, h, m));
  };

  const selectClass =
    'px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--brand)] disabled:opacity-50';

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--fg-2)] mb-1.5">
        {label}
        {required && <span className="text-[var(--danger)] ml-1">*</span>}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => update({ date: e.target.value })}
          required={required}
          className="flex-1 min-w-[160px] px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--fg)] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--brand)]"
          lang="pt-BR"
        />
        <span className="font-mono text-[var(--fg-3)]">·</span>
        <select
          aria-label="Hora"
          value={hour}
          onChange={(e) => update({ hour: e.target.value })}
          className={`${selectClass} font-mono tabular-nums`}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="font-mono text-[var(--fg-3)]">:</span>
        <select
          aria-label="Minuto"
          value={minute}
          onChange={(e) => update({ minute: e.target.value })}
          className={`${selectClass} font-mono tabular-nums`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--fg-3)]">24h</span>
      </div>
      {error && <p className="mt-1.5 text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
