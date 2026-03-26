import { prisma } from '@/lib/prisma';
import { getPracticeStatusLabel } from '@/lib/practice-status';
import { formatMinutes } from '@/lib/utils';
import { logAudit } from '@/lib/services/audit';
import type { PracticeRecord, User } from '@prisma/client';

type PracticeRecordWithUsers = PracticeRecord & {
  trainee: User;
  supervisor: User;
};

type DiscordGuild = { id: string; name: string };
type DiscordChannel = { id: string; name: string; type: number };

function formatDate(value: Date) {
  return value.toLocaleString('cs-CZ', {
    timeZone: 'Europe/Prague',
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false
  });
}

function buildEmbedBase(title: string, color: number, fields: Array<{ name: string; value: string; inline?: boolean }>) {
  return { embeds: [{ title, color, fields, timestamp: new Date().toISOString() }] };
}

async function postWebhook(payload: unknown) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return false;
  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.ok;
}

async function postBotMessage(channelId: string, payload: unknown) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return false;

  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return response.ok;
}

export async function getDiscordSettings() {
  return prisma.discordSettings.findFirst({ orderBy: { createdAt: 'asc' } });
}

export async function getSharedGuildsForAdmin(discordAccessToken: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !discordAccessToken) return [];

  const [userGuildsResponse, botGuildsResponse] = await Promise.all([
    fetch('https://discord.com/api/v10/users/@me/guilds', { headers: { Authorization: `Bearer ${discordAccessToken}` } }),
    fetch('https://discord.com/api/v10/users/@me/guilds', { headers: { Authorization: `Bot ${token}` } })
  ]);

  if (!userGuildsResponse.ok || !botGuildsResponse.ok) return [];
  const userGuilds = (await userGuildsResponse.json()) as DiscordGuild[];
  const botGuilds = (await botGuildsResponse.json()) as DiscordGuild[];
  const botGuildIds = new Set(botGuilds.map((g) => g.id));
  return userGuilds.filter((g) => botGuildIds.has(g.id));
}

export async function getGuildChannels(guildId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !guildId) return [];

  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` }
  });
  if (!response.ok) return [];

  const channels = (await response.json()) as DiscordChannel[];
  return channels.filter((channel) => channel.type === 0 || channel.type === 5);
}

export async function saveDiscordChannelSettings(input: {
  actorUserId: string;
  guildId: string;
  guildName: string;
  approvalChannelId: string;
  approvalChannelName: string;
  rejectionChannelId: string;
  rejectionChannelName: string;
}) {
  const current = await getDiscordSettings();
  const next = await prisma.discordSettings.upsert({
    where: { id: current?.id ?? 'discord-settings-singleton' },
    create: { ...input, id: current?.id ?? 'discord-settings-singleton', updatedByUserId: input.actorUserId },
    update: { ...input, updatedByUserId: input.actorUserId }
  });

  await logAudit(input.actorUserId, 'DiscordSettings', next.id, 'CHANNEL_SETTINGS_CHANGE', current, next);
  return next;
}

async function sendByConfig(payload: unknown, channelType: 'approval' | 'rejection', actorUserId?: string | null) {
  const settings = await getDiscordSettings();
  const channelId = channelType === 'approval' ? settings?.approvalChannelId : settings?.rejectionChannelId;

  if (channelId) {
    const sent = await postBotMessage(channelId, payload);
    if (!sent) {
      await logAudit(actorUserId ?? null, 'DiscordNotification', channelId, 'SEND_FAILURE', undefined, { channelType, reason: 'bot_send_failed' });
    }
    if (sent) return true;
  }

  const webhookSent = await postWebhook(payload);
  if (!webhookSent) {
    await logAudit(actorUserId ?? null, 'DiscordNotification', channelId ?? 'webhook-fallback', 'SEND_FAILURE', undefined, { channelType, reason: 'fallback_failed' });
  }
  return webhookSent;
}

export async function sendDiscordTestNotification(actorUserId: string) {
  const payload = buildEmbedBase('🧪 Test notifikace EMS Praxe', 0x2563eb, [
    { name: 'Stav', value: 'Konfigurace bota je aktivní.', inline: false },
    { name: 'Čas', value: new Date().toLocaleString('cs-CZ'), inline: false }
  ]);
  return sendByConfig(payload, 'approval', actorUserId);
}

export async function notifyPracticeApproved(record: PracticeRecordWithUsers, remainingMinutes: number, actorUserId?: string | null) {
  const payload = buildEmbedBase('✅ Praxe byla schválena', 0x16a34a, [
    { name: 'Trainee', value: record.trainee.fullName, inline: true },
    { name: 'Dohlížející důstojník', value: record.supervisor.fullName, inline: true },
    { name: 'Začátek praxe', value: formatDate(record.startAt), inline: false },
    { name: 'Konec praxe', value: formatDate(record.endAt), inline: false },
    { name: 'Délka', value: formatMinutes(record.durationMinutes), inline: true },
    { name: 'Zbývající čas praxí', value: formatMinutes(remainingMinutes), inline: true },
    { name: 'Výsledný status', value: getPracticeStatusLabel(record.status), inline: true },
    { name: 'Podpis dohlížejícího', value: record.supervisorSignature ?? '-', inline: false }
  ]);
  return sendByConfig(payload, 'approval', actorUserId);
}

export async function notifyPracticeRejected(record: PracticeRecordWithUsers, actorUserId?: string | null) {
  const payload = buildEmbedBase('❌ Praxe byla zamítnuta', 0xdc2626, [
    { name: 'Trainee', value: record.trainee.fullName, inline: true },
    { name: 'Dohlížející důstojník', value: record.supervisor.fullName, inline: true },
    { name: 'Začátek praxe', value: formatDate(record.startAt), inline: false },
    { name: 'Konec praxe', value: formatDate(record.endAt), inline: false },
    { name: 'Délka', value: formatMinutes(record.durationMinutes), inline: true },
    { name: 'Výsledný status', value: getPracticeStatusLabel(record.status), inline: true },
    { name: 'Důvod zamítnutí', value: record.supervisorComment ?? '-', inline: false }
  ]);
  return sendByConfig(payload, 'rejection', actorUserId);
}
