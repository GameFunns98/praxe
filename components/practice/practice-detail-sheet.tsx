'use client';

import { useMemo, useState } from 'react';
import type { AuditLog, PracticeRecord, PracticeRequirement, User } from '@prisma/client';
import { approvePracticeRecord, rejectPracticeRecord } from '@/app/(protected)/practice/actions';
import { PracticeStatusBadge } from '@/components/practice-status-badge';
import { Button } from '@/components/ui/button';
import { formatMinutes } from '@/lib/utils';
import { Roles } from '@/lib/auth/roles';

type PracticeRecordWithRelations = PracticeRecord & {
  trainee: User;
  supervisor: User;
  auditItems: AuditLog[];
  requirement: PracticeRequirement | null;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString('cs-CZ', {
    timeZone: 'Europe/Prague',
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false
  });
}

export function PracticeDetailSheet({
  records,
  currentUserId,
  currentUserRole
}: {
  records: PracticeRecordWithRelations[];
  currentUserId: string;
  currentUserRole: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => records.find((r) => r.id === selectedId) ?? null, [records, selectedId]);

  const canApproveReject =
    selected &&
    (selected.status === 'PENDING' || selected.status === 'LATE_PENDING') &&
    (currentUserRole === Roles.ADMIN || (currentUserRole === Roles.TRAINING_OFFICER && selected.supervisorId === currentUserId));

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Trainee</th>
              <th className="px-4 py-3 text-left font-medium">Dohlížející</th>
              <th className="px-4 py-3 text-left font-medium">Datum</th>
              <th className="px-4 py-3 text-left font-medium">Délka</th>
              <th className="px-4 py-3 text-left font-medium">Stav</th>
              <th className="px-4 py-3 text-right font-medium">Akce</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-3">{record.trainee.fullName}</td>
                <td className="px-4 py-3">{record.supervisor.fullName}</td>
                <td className="px-4 py-3">{formatDate(record.startAt)}</td>
                <td className="px-4 py-3">{formatMinutes(record.durationMinutes)}</td>
                <td className="px-4 py-3"><PracticeStatusBadge status={record.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" onClick={() => setSelectedId(record.id)}>Otevřít</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedId(null)} aria-label="Zavřít detail" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-2xl border bg-white p-5 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:w-[720px] md:rounded-none md:border-l">
            <div className="mb-4 flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Detail praxe</p>
                <h2 className="text-xl font-semibold">{selected.trainee.fullName}</h2>
              </div>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>Zavřít</Button>
            </div>

            <section className="space-y-2 rounded-xl border p-4 print:border-none">
              <h3 className="font-semibold">Souhrn záznamu</h3>
              <p><strong>Stav:</strong> <PracticeStatusBadge status={selected.status} /></p>
              <p><strong>Začátek:</strong> {formatDate(selected.startAt)}</p>
              <p><strong>Konec:</strong> {formatDate(selected.endAt)}</p>
              <p><strong>Délka:</strong> {formatMinutes(selected.durationMinutes)}</p>
              <p><strong>Role / hodnost / volačka trainee:</strong> {selected.trainee.rankTitle} / {selected.trainee.callsign}</p>
              <p><strong>Dohlížející:</strong> {selected.supervisor.fullName} ({selected.supervisor.callsign})</p>
              <p><strong>Zbývající čas praxí:</strong> {formatMinutes(selected.requirement?.remainingMinutes ?? 0)}</p>
              <p><strong>Zbývající po schválení:</strong> {formatMinutes(Math.max((selected.requirement?.remainingMinutes ?? 0) - selected.durationMinutes, 0))}</p>
            </section>

            {!selected.submittedWithinOneHour ? (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                ⚠️ Tento zápis byl odeslán později než 1 hodinu po ukončení praxe.
              </div>
            ) : null}

            <section className="mt-4 space-y-2 rounded-xl border p-4">
              <h3 className="font-semibold">Podpisy</h3>
              <p><strong>Podpis trainee:</strong> {selected.traineeSignature}</p>
              <p><strong>Podpis dohlížejícího:</strong> {selected.supervisorSignature ?? 'Zatím nevyplněno'}</p>
            </section>

            <section className="mt-4 space-y-2 rounded-xl border p-4">
              <h3 className="font-semibold">Schválení / zamítnutí</h3>
              {canApproveReject ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <form action={approvePracticeRecord} className="space-y-2 rounded-lg border p-3">
                    <h4 className="font-medium">Sekce schválení</h4>
                    <input type="hidden" name="id" value={selected.id} />
                    <label className="text-sm">Podpis dohlížejícího</label>
                    <input name="supervisorSignature" className="w-full rounded-md border px-3 py-2" required />
                    <label className="text-sm">Interní poznámka (volitelně)</label>
                    <textarea name="supervisorComment" className="min-h-20 w-full rounded-md border px-3 py-2" />
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Schválit praxi</Button>
                  </form>

                  <form action={rejectPracticeRecord} className="space-y-2 rounded-lg border p-3">
                    <h4 className="font-medium">Sekce zamítnutí</h4>
                    <input type="hidden" name="id" value={selected.id} />
                    <label className="text-sm">Důvod zamítnutí</label>
                    <textarea name="supervisorComment" className="min-h-24 w-full rounded-md border px-3 py-2" required />
                    <Button className="w-full bg-rose-600 hover:bg-rose-700">Zamítnout praxi</Button>
                  </form>
                </div>
              ) : (
                <p className="text-sm text-slate-600">U tohoto záznamu nejsou akce schválení/zamítnutí dostupné.</p>
              )}
            </section>

            <section className="mt-4 space-y-2 rounded-xl border p-4">
              <h3 className="font-semibold">Poznámky a auditní historie</h3>
              {selected.supervisorComment ? <p><strong>Komentář:</strong> {selected.supervisorComment}</p> : <p className="text-sm text-slate-500">Bez komentáře.</p>}
              {selected.auditItems.length === 0 ? (
                <p className="text-sm text-slate-500">Bez auditních záznamů.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {selected.auditItems.map((item) => (
                    <li key={item.id} className="rounded-md border p-2">
                      {formatDate(item.createdAt)} — {item.action}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="mt-4 text-xs text-slate-500 print:hidden">Tip: Pro tisk použijte dialog pro tisk v prohlížeči (Ctrl/Cmd + P). Rozvržení detailu je optimalizované pro tisk.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
