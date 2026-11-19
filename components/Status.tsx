'use client';

import type { Kepekaan } from '@/lib/types';
import { useI18n } from './I18nProvider';

export default function Status({ kepekaan }: { kepekaan: Kepekaan }) {
  const { t } = useI18n();
  return kepekaan === 'perlu_persetujuan' ? (
    <span className="status status-peka">{t.common.needsConsent}</span>
  ) : (
    <span className="status status-terbuka">{t.common.open}</span>
  );
}
