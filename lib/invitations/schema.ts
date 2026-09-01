import { z } from "zod";

const hexColour = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Choose a valid colour");
const eventDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, "Choose a valid event date");

export const invitationSubmissionSchema = z.object({
  templateSlug: z.enum(["heritage-night", "rose-garden", "midnight-vows"]),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160).or(z.literal("")).optional(),
  personOneName: z.string().trim().min(1).max(60),
  personTwoName: z.string().trim().min(1).max(60),
  intro: z.string().trim().min(10).max(300),
  message: z.string().trim().min(10).max(600),
  eventDate,
  eventTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Choose a valid start time"),
  venue: z.string().trim().min(2).max(150),
  address: z.string().trim().min(2).max(240),
  primaryColor: hexColour,
  secondaryColor: hexColour,
  accentColor: hexColour,
});

export type InvitationSubmission = z.infer<typeof invitationSubmissionSchema>;
