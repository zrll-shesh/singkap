interface Bar {
  label: string;
  value: number;
  display: string;
  tone?: 'kunyit' | 'mengkudu' | 'tarum';
}

export default function Bars({ data, max = 1 }: { data: Bar[]; max?: number }) {
  return (
    <div role="list">
      {data.map((d) => (
        <div className="batang" role="listitem" key={d.label}>
          <span>{d.label}</span>
          <span className="batang-jalur" aria-hidden="true">
            <span
              className={`batang-isi ${d.tone === 'tarum' ? '' : d.tone ?? 'kunyit'}`}
              style={{ width: `${Math.max(1.5, (d.value / max) * 100)}%`, display: 'block' }}
            />
          </span>
          <span className="batang-angka">{d.display}</span>
        </div>
      ))}
    </div>
  );
}
