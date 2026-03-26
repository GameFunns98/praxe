import type { PracticeStatus } from '@prisma/client';

export const PRACTICE_STATUS_LABELS: Record<PracticeStatus, string> = {
  PENDING: 'Čeká na schválení',
  APPROVED: 'Schváleno',
  REJECTED: 'Zamítnuto',
  LATE_PENDING: 'Pozdní, čeká na schválení',
  LATE_APPROVED: 'Pozdně schváleno',
  CANCELLED: 'Zrušeno'
};

export const PRACTICE_STATUS_STYLES: Record<PracticeStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  LATE_PENDING: 'bg-orange-50 text-orange-700 border-orange-200',
  LATE_APPROVED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200'
};

export function getPracticeStatusLabel(status: PracticeStatus) {
  return PRACTICE_STATUS_LABELS[status];
}
