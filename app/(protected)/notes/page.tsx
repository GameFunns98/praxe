import { requireSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export default async function NotesPage() {
  await requireSession();
  const notes = await prisma.excuseOrNote.findMany({ include: { user: true, creator: true }, orderBy: { createdAt: 'desc' } });
  return <div>
    <h1 className="mb-3 text-xl font-semibold">Poznámky, omluvy, varování a sankce</h1>
    {notes.map((n: any)=><div key={n.id} className="mb-2 rounded border bg-white p-3"><p className="font-medium">{n.type} - {n.title}</p><p>{n.content}</p><p className="text-xs">Uživatel: {n.user.fullName}, vytvořil: {n.creator.fullName}</p></div>)}
  </div>;
}
