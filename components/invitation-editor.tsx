"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { InvitationRenderer } from "@/components/invitation-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  invitationSubmissionSchema,
  type InvitationSubmission,
} from "@/lib/invitations/schema";
import type { TemplateDefinition } from "@/lib/invitations/templates";

export function InvitationEditor({ template }: { template: TemplateDefinition }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const form = useForm<InvitationSubmission>({
    resolver: zodResolver(invitationSubmissionSchema),
    defaultValues: {
      templateSlug: template.slug,
      customerName: "",
      phone: "",
      email: "",
      ...template.defaultContent,
    },
  });
  const values = useWatch({ control: form.control });
  const content = { ...template.defaultContent, ...values } as InvitationSubmission;

  async function submit(value: InvitationSubmission) {
    setSubmitError("");
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const result = (await response.json()) as { requestCode?: string; error?: string };
      if (!response.ok || !result.requestCode) {
        setSubmitError(result.error ?? "We could not save your invitation.");
        return;
      }
      router.push(`/submitted/${result.requestCode}`);
    } catch {
      setSubmitError("We could not reach the server. Please check your connection and try again.");
    }
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <Link href={`/#collection`}><ArrowLeft aria-hidden="true" /> Templates</Link>
        <div><span>Customizing</span><strong>{template.name}</strong></div>
        <span className="editor-step">Invitation details</span>
      </header>

      <div className="editor-layout">
        <form className="editor-panel" onSubmit={form.handleSubmit(submit)}>
          <div className="editor-intro">
            <p className="eyebrow dark">Make it personal</p>
            <h1>Your invitation details</h1>
            <p>Changes appear in the preview as you type.</p>
          </div>

          <fieldset>
            <legend>Names and words</legend>
            <div className="form-grid two">
              <Field label="First name" error={form.formState.errors.personOneName?.message}><Input {...form.register("personOneName")} /></Field>
              <Field label="Second name" error={form.formState.errors.personTwoName?.message}><Input {...form.register("personTwoName")} /></Field>
            </div>
            <Field label="Invitation introduction" error={form.formState.errors.intro?.message}><Textarea rows={3} {...form.register("intro")} /></Field>
            <Field label="Personal message" error={form.formState.errors.message?.message}><Textarea rows={5} {...form.register("message")} /></Field>
          </fieldset>

          <fieldset>
            <legend>Date and place</legend>
            <div className="form-grid two">
              <Field label="Event date" error={form.formState.errors.eventDate?.message}><Input type="date" {...form.register("eventDate")} /></Field>
              <Field label="Start time" error={form.formState.errors.eventTime?.message}><Input type="time" {...form.register("eventTime")} /></Field>
            </div>
            <Field label="Venue" error={form.formState.errors.venue?.message}><Input {...form.register("venue")} /></Field>
            <Field label="Address" error={form.formState.errors.address?.message}><Textarea rows={3} {...form.register("address")} /></Field>
          </fieldset>

          <fieldset>
            <legend>Colours</legend>
            <div className="colour-grid">
              <ColourField label="Primary" {...form.register("primaryColor")} />
              <ColourField label="Background" {...form.register("secondaryColor")} />
              <ColourField label="Accent" {...form.register("accentColor")} />
            </div>
          </fieldset>

          <fieldset>
            <legend>Your contact details</legend>
            <p className="fieldset-note">We use these details only to contact you about this invitation and payment.</p>
            <Field label="Your name" error={form.formState.errors.customerName?.message}><Input autoComplete="name" {...form.register("customerName")} /></Field>
            <Field label="Phone or WhatsApp number" error={form.formState.errors.phone?.message}><Input type="tel" autoComplete="tel" {...form.register("phone")} /></Field>
            <Field label="Email (optional)" error={form.formState.errors.email?.message}><Input type="email" autoComplete="email" {...form.register("email")} /></Field>
          </fieldset>

          {submitError ? <p className="form-error" role="alert">{submitError}</p> : null}
          <Button type="submit" size="lg" className="editor-submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <><Loader2 className="animate-spin" /> Saving invitation</> : <>Submit invitation <ArrowRight /></>}
          </Button>
        </form>

        <aside className="editor-preview" aria-label="Live invitation preview">
          <div className="editor-preview-label"><span>Live preview</span><span>Scroll to explore</span></div>
          <div className="editor-preview-frame">
            <InvitationRenderer template={template} content={content} preview />
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <div className="form-field"><Label className="field-label">{label}{children}</Label>{error ? <p className="field-error">{error}</p> : null}</div>;
}

function ColourField({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return <label className="colour-field"><input type="color" {...props} /><span>{label}</span></label>;
}
