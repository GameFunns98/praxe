import { differenceInMinutes } from 'date-fns';

export type PracticeStatusValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'LATE_PENDING' | 'LATE_APPROVED' | 'CANCELLED';

export function calculateDurationMinutes(startAt: Date, endAt: Date) {
  return differenceInMinutes(endAt, startAt);
}

export function isSubmittedWithinOneHour(endAt: Date, submittedAt: Date) {
  return differenceInMinutes(submittedAt, endAt) <= 60;
}

export function resolveInitialStatus(withinOneHour: boolean): PracticeStatusValue {
  return withinOneHour ? 'PENDING' : 'LATE_PENDING';
}

export function computeDeduction(remainingMinutes: number, durationMinutes: number) {
  return {
    deducted: Math.min(remainingMinutes, durationMinutes),
    nextRemaining: Math.max(0, remainingMinutes - durationMinutes)
  };
}

export function canApprove(status: PracticeStatusValue, deductedMinutes: number) {
  return (status === 'PENDING' || status === 'LATE_PENDING') && deductedMinutes === 0;
}
