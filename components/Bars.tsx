'use client';

import { AnimatedBars, type BarDatum } from './Charts';

export default function Bars({ data, max = 1 }: { data: BarDatum[]; max?: number }) {
  return <AnimatedBars data={data} max={max} />;
}
