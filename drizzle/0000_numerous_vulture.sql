CREATE TABLE `event_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`checked_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_state` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
