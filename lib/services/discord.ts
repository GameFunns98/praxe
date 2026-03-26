import type { PracticeRecord, User } from '@prisma/client';
import { getPracticeStatusLabel } from '@/lib/practice-status';
import { formatMinutes } from '@/lib/utils';

type PracticeRecordWithUsers = PracticeRecord & {
  trainee: User;
  supervisor: User;
};

function formatDate(value: Date) {
  return value.toLocaleString('cs-CZ', {
    timeZone: 'Europe/Prague',
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false
  });
}

async function postToDiscord(payload: unknown) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    console.warn('[Discord] DISCORD_WEBHOOK_URL není nastaveno. Odeslání notifikace přeskočeno.');
    return false;
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`[Discord] Webhook selhal: ${response.status} ${response.statusText}`);
  }

  return true;
}

export async function notifyPracticeApproved(record: PracticeRecordWithUsers, remainingMinutes: number) {
  const payload = {
    embeds: [
      {
        title: '✅ Praxe byla schválena',
        color: 0x16a34a,
        fields: [
          { name: 'Trainee', value: record.trainee.fullName, inline: true },
          { name: 'Dohlížející důstojník', value: record.supervisor.fullName, inline: true },
          { name: 'Začátek praxe', value: formatDate(record.startAt), inline: false },
          { name: 'Konec praxe', value: formatDate(record.endAt), inline: false },
          { name: 'Délka', value: formatMinutes(record.durationMinutes), inline: true },
          { name: 'Zbývající čas praxí', value: formatMinutes(remainingMinutes), inline: true },
          { name: 'Výsledný status', value: getPracticeStatusLabel(record.status), inline: true },
          { name: 'Podpis dohlížejícího', value: record.supervisorSignature ?? '-', inline: false }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  return postToDiscord(payload);
}

export async function notifyPracticeRejected(record: PracticeRecordWithUsers) {
  const payload = {
    embeds: [
      {
        title: '❌ Praxe byla zamítnuta',
        color: 0xdc2626,
        fields: [
          { name: 'Trainee', value: record.trainee.fullName, inline: true },
          { name: 'Dohlížející důstojník', value: record.supervisor.fullName, inline: true },
          { name: 'Začátek praxe', value: formatDate(record.startAt), inline: false },
          { name: 'Konec praxe', value: formatDate(record.endAt), inline: false },
          { name: 'Délka', value: formatMinutes(record.durationMinutes), inline: true },
          { name: 'Výsledný status', value: getPracticeStatusLabel(record.status), inline: true },
          { name: 'Důvod zamítnutí', value: record.supervisorComment ?? '-', inline: false }
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  return postToDiscord(payload);
}
