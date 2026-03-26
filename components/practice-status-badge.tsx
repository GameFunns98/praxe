import type { PracticeStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { getPracticeStatusLabel, PRACTICE_STATUS_STYLES } from '@/lib/practice-status';

export function PracticeStatusBadge({ status }: { status: PracticeStatus }) {
  return <Badge className={PRACTICE_STATUS_STYLES[status]}>{getPracticeStatusLabel(status)}</Badge>;
}
