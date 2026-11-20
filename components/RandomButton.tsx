'use client';

import { useRouter } from 'next/navigation';

export default function RandomButton({ ids, label, className }: { ids: string[]; label: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className ?? 'tombol tombol-garis'}
      onClick={() => router.push(`/warisan/${ids[Math.floor(Math.random() * ids.length)]}`)}
    >
      {label}
    </button>
  );
}
