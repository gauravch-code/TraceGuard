CREATE TABLE `agent_keys` (
	`agent_id` integer PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_keys_key_hash_unique` ON `agent_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` integer NOT NULL,
	`task` text NOT NULL,
	`status` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`cost_microusd` integer DEFAULT 0 NOT NULL,
	`steps_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_runs_created_at` ON `runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_runs_agent_created_at` ON `runs` (`agent_id`,`created_at`);