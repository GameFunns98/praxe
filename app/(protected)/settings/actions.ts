'use server';

import { revalidatePath } from 'next/cache';
import { Roles } from '@/lib/auth/roles';
import { requireSession } from '@/lib/auth/session';
import { getGuildChannels, saveDiscordChannelSettings, sendDiscordTestNotification } from '@/lib/services/discord';

async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== Roles.ADMIN) throw new Error('Pouze admin.');
  return session;
}

export async function saveDiscordSettingsAction(formData: FormData) {
  const session = await requireAdmin();
  const guildId = String(formData.get('guildId'));
  const guildName = String(formData.get('guildName'));
  const approvalChannelId = String(formData.get('approvalChannelId'));
  const rejectionChannelId = String(formData.get('rejectionChannelId'));

  const channels = await getGuildChannels(guildId);
  const approval = channels.find((c) => c.id === approvalChannelId);
  const rejection = channels.find((c) => c.id === rejectionChannelId);

  if (!approval || !rejection) throw new Error('Vybrané kanály nejsou dostupné pro bota.');

  await saveDiscordChannelSettings({
    actorUserId: session.user.id,
    guildId,
    guildName,
    approvalChannelId,
    approvalChannelName: approval.name,
    rejectionChannelId,
    rejectionChannelName: rejection.name
  });

  revalidatePath('/settings');
}

export async function sendDiscordTestAction() {
  const session = await requireAdmin();
  await sendDiscordTestNotification(session.user.id);
  revalidatePath('/settings');
}
