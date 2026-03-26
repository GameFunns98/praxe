import { describe, expect, it } from 'vitest';
import { calculateDurationMinutes, canApprove, computeDeduction, isSubmittedWithinOneHour } from '@/lib/services/practice';

describe('practice logic', () => {
  it('duration calculation', () => {
    const start = new Date('2026-01-01T08:00:00Z');
    const end = new Date('2026-01-01T10:30:00Z');
    expect(calculateDurationMinutes(start, end)).toBe(150);
  });

  it('late submission check', () => {
    const end = new Date('2026-01-01T10:00:00Z');
    expect(isSubmittedWithinOneHour(end, new Date('2026-01-01T10:45:00Z'))).toBe(true);
    expect(isSubmittedWithinOneHour(end, new Date('2026-01-01T11:05:00Z'))).toBe(false);
  });

  it('deduction never negative', () => {
    expect(computeDeduction(30, 60)).toEqual({ deducted: 30, nextRemaining: 0 });
  });

  it('prevents double approval', () => {
    expect(canApprove('PENDING', 0)).toBe(true);
    expect(canApprove('APPROVED', 60)).toBe(false);
  });
});
