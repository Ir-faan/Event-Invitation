CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`request_code` text NOT NULL,
	`public_id` text NOT NULL,
	`template_slug` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`person_one_name` text NOT NULL,
	`person_two_name` text NOT NULL,
	`intro` text NOT NULL,
	`message` text NOT NULL,
	`event_date` text NOT NULL,
	`event_time` text NOT NULL,
	`venue` text NOT NULL,
	`address` text NOT NULL,
	`primary_color` text NOT NULL,
	`secondary_color` text NOT NULL,
	`accent_color` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_request_code_unique` ON `invitations` (`request_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_public_id_unique` ON `invitations` (`public_id`);--> statement-breakpoint
CREATE INDEX `idx_invitations_status_created_at` ON `invitations` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_invitations_event_date` ON `invitations` (`event_date`);