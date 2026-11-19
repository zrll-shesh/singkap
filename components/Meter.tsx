'use client';

import { useI18n } from './I18nProvider';

// Skala tampilan: IKD tertinggi dalam data berada di sekitar 0,55
const IKD_SKALA = 0.6;

export default function Meter({ value }: { value: number | null }) {
  const { t, f } = useI18n();
  if (value === null) return <span className="meter redup">{t.common.ikdNone}</span>;
  return (
    <span className="meter" title={`${t.common.ikd} ${f.dec(value, 3)}`}>
      <span className="meter-jalur" aria-hidden="true">
        <span className="meter-isi" style={{ width: `${Math.min(100, (value / IKD_SKALA) * 100)}%`, display: 'block' }} />
      </span>
      <span>
        <span className="sr-only">{t.common.ikd} </span>
        {f.dec(value, 2)}
      </span>
    </span>
  );
}
