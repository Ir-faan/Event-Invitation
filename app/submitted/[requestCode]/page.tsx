import Link from "next/link";
import { Check } from "lucide-react";

export default async function SubmittedPage({ params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  return (
    <main className="confirmation-page">
      <div className="confirmation-card">
        <span className="confirmation-icon"><Check aria-hidden="true" /></span>
        <p className="eyebrow dark">Invitation received</p>
        <h1>Thank you. Your design is safely with us.</h1>
        <p>We&apos;ll review your invitation and contact you using the details you provided to confirm the final design and payment.</p>
        <div className="request-code"><span>Your request reference</span><strong>{requestCode}</strong></div>
        <Link href="/" className="button button-dark">Return to Event Invitations</Link>
      </div>
    </main>
  );
}
