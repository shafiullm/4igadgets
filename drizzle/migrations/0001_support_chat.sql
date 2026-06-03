-- Convert support_messages from (message + reply) to a real chat model:
-- one row per message with a `sender` ('user' | 'admin') and a `body`.
-- The old table holds only throwaway test data, so we recreate it.
DROP TABLE IF EXISTS `support_messages`;
--> statement-breakpoint
CREATE TABLE `support_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
