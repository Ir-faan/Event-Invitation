import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; configuration?: string }> }) {
  const query = await searchParams;
  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link href="/" className="brand-mark"><span className="brand-monogram">EI</span><span>Event Invitations</span></Link>
        <div className="admin-lock"><LockKeyhole aria-hidden="true" /></div>
        <p className="eyebrow dark">Private administration</p>
        <h1>Welcome back</h1>
        <p>Sign in to review and publish invitation requests.</p>
        {query.error ? <p className="form-error" role="alert">The username or password is incorrect.</p> : null}
        {query.configuration ? <p className="form-error" role="alert">Admin access has not been configured yet.</p> : null}
        <form action="/api/admin/login" method="post">
          <div className="form-field"><Label htmlFor="username">Username</Label><Input id="username" name="username" autoComplete="username" required /></div>
          <div className="form-field"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
          <button className="button button-dark" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
