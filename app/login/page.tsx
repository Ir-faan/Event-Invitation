"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, LogIn } from "lucide-react";
import "../dashboard/dashboard.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { loggedIn?: boolean; error?: string };
      if (!response.ok || !result.loggedIn) throw new Error(result.error || "Could not sign in.");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next && /^\/dashboard(?:\/|\?|$)/.test(next) ? next : "/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="orders-dashboard orders-login-page">
      <div className="orders-login-card">
        <span className="orders-login-mark"><LockKeyhole aria-hidden="true" /></span>
        <p className="orders-login-kicker">Paperless Invites · Private workspace</p>
        <h1>Welcome back</h1>
        <p className="orders-login-description">Sign in to review orders, edit invitations and publish them for guests.</p>
        <form onSubmit={(event) => void submit(event)}>
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p role="alert" className="orders-login-error">{error}</p>}
          <button type="submit" disabled={busy}><LogIn aria-hidden="true" /> {busy ? "Signing in…" : "Sign in to orders"} <ArrowRight aria-hidden="true" /></button>
        </form>
        <Link href="/">← Back to home</Link>
      </div>
    </main>
  );
}
