import Link from "next/link";
import { ArrowLeft, PencilLine } from "lucide-react";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation-renderer";
import { getTemplate, templates } from "@/lib/invitations/templates";

export function generateStaticParams() {
  return templates.map((template) => ({ slug: template.slug }));
}

export default async function TemplatePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();

  return (
    <main className="template-page-shell">
      <div className="preview-toolbar">
        <Link href="/#collection"><ArrowLeft aria-hidden="true" /> All templates</Link>
        <div><span>{template.category}</span><strong>{template.name}</strong></div>
        <Link href={`/create/${template.slug}`} className="button button-dark">Customize <PencilLine aria-hidden="true" /></Link>
      </div>
      <InvitationRenderer template={template} content={template.defaultContent} />
    </main>
  );
}
