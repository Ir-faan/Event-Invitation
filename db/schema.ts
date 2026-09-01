import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    requestCode: text("request_code").notNull().unique(),
    publicId: text("public_id").notNull().unique(),
    templateSlug: text("template_slug", {
      enum: ["heritage-night", "rose-garden", "midnight-vows"],
    }).notNull(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    personOneName: text("person_one_name").notNull(),
    personTwoName: text("person_two_name").notNull(),
    intro: text("intro").notNull(),
    message: text("message").notNull(),
    eventDate: text("event_date").notNull(),
    eventTime: text("event_time").notNull(),
    venue: text("venue").notNull(),
    address: text("address").notNull(),
    primaryColor: text("primary_color").notNull(),
    secondaryColor: text("secondary_color").notNull(),
    accentColor: text("accent_color").notNull(),
    status: text("status", { enum: ["submitted", "published", "archived"] })
      .notNull()
      .default("submitted"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    publishedAt: text("published_at"),
  },
  (table) => [
    index("idx_invitations_status_created_at").on(table.status, table.createdAt),
    index("idx_invitations_event_date").on(table.eventDate),
  ],
);

export type InvitationRecord = typeof invitations.$inferSelect;
