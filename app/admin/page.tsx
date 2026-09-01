import { desc } from "drizzle-orm";
import { ExternalLink, LogOut, Send } from "lucide-react";
import Link from "next/link";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { formatEventDate } from "@/lib/invitations/templates";
import { requireAdmin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const rows = await getDb().select().from(invitations).orderBy(desc(invitations.createdAt)).limit(100);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="brand-mark"><span className="brand-monogram">EI</span><span>Event Invitations</span></div>
        <div><span>Administrator</span><form action="/api/admin/logout" method="post"><button type="submit"><LogOut aria-hidden="true" /> Sign out</button></form></div>
      </header>
      <section className="admin-content">
        <div className="admin-title"><div><p className="eyebrow dark">Invitation requests</p><h1>Publishing desk</h1></div><span>{rows.length} total requests</span></div>
        {rows.length === 0 ? (
          <div className="admin-empty"><Send aria-hidden="true" /><h2>No invitations yet</h2><p>New customer submissions will appear here.</p></div>
        ) : (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Invitation</th><th>Event date</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}>
              <td><strong>{row.personOneName} &amp; {row.personTwoName}</strong><span>{row.requestCode} · {row.templateSlug.replaceAll("-", " ")}</span></td>
              <td>{formatEventDate(row.eventDate)}<span>{row.venue}</span></td>
              <td>{row.customerName}<span>{row.phone}</span></td>
              <td><span className={`status status-${row.status}`}>{row.status}</span></td>
              <td><div className="admin-actions">
                <Link href={`/admin/invitations/${row.id}/preview`} target="_blank">Preview <ExternalLink /></Link>
                {row.status === "published" ? <Link href={`/i/${row.publicId}`} target="_blank">Public link <ExternalLink /></Link> : <form action={`/api/admin/invitations/${row.id}/publish`} method="post"><button type="submit">Publish</button></form>}
              </div></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
