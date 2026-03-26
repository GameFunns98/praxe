import { z } from 'zod';

export const createPracticeSchema = z.object({
  supervisorId: z.string().min(1, 'Musíte vybrat Training Officer.'),
  startAt: z.string().min(1, 'Datum počátku je povinné.'),
  endAt: z.string().min(1, 'Datum ukončení je povinné.'),
  traineeSignature: z.string().min(2, 'Podpis je povinný.')
});

export const approveSchema = z.object({
  id: z.string(),
  supervisorSignature: z.string().min(2, 'Podpis dohlížejícího důstojníka je povinný.'),
  supervisorComment: z.string().optional()
});

export const rejectSchema = z.object({
  id: z.string(),
  supervisorComment: z.string().min(2, 'Komentář k zamítnutí je povinný.')
});
